import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { paySession } from "../../api/sessionApi";
import { getDiscounts } from "../../api/discountApi";
import { getWorkflow } from "../../api/settingApi";
import { useSettings } from "../../context/SettingContext";

export default function PaySessionModal({ session, onClose, onPaid }) {
  const { t } = useTranslation();
  const { formatMoney } = useSettings();
  const [normalAmount, setNormalAmount] = useState("");
  const [note, setNote] = useState("");
  const [planAmounts, setPlanAmounts] = useState({});
  const [settleNormal, setSettleNormal] = useState(false);
  const [discounts, setDiscounts] = useState([]);
  const [discountId, setDiscountId] = useState("");
  const [workflow, setWorkflow] = useState(null); // branch rules: settle / discounts (null = not loaded, the server still checks)
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    getDiscounts().then((res) => alive && setDiscounts(res?.data || [])).catch(() => {});
    getWorkflow().then((res) => alive && setWorkflow(res?.data || null)).catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!session) return null;

  const curr = session?.currency_code;
  const minTotal = Number(session?.totals?.min_total || 0);
  const total = Number(session?.totals?.total || 0);
  const totalPaid = Number(session?.totals?.total_paid || 0);
  const remaining = Number(session?.totals?.remaining ?? (total - totalPaid));
  const normalSettled = !!session?.totals?.is_paid; // normal already paid/settled → hide the normal section

  // the branch rules: settle on/off, discounts on/off, and only discounts within the biggest allowed %
  const canSettle = workflow?.allow_settle_unpaid !== false;
  const maxDiscount = workflow ? Math.round((total * Number(workflow.max_discount_percent)) / 100) : Infinity;
  const discountAmountOf = (d) => Math.min(
    d.type === "percent" ? Math.round((total * Number(d.value)) / 100) : Number(d.value),
    Math.max(0, total - totalPaid)
  );
  const usableDiscounts = workflow?.allow_discounts === false ? [] : discounts.filter((d) => discountAmountOf(d) <= maxDiscount);

  // A discount already applied to this session (from an earlier payment).
  const appliedAmount = Number(session?.totals?.discount_amount || 0);
  const appliedName = session?.totals?.discount_name || null;
  const discountApplied = appliedAmount > 0;

  // Preview of a newly-picked discount (only when none is applied yet). The
  // backend re-computes + caps authoritatively.
  const pickedDiscount = discounts.find((d) => String(d.id) === String(discountId)) || null;
  const discountPreview = pickedDiscount
    ? Math.min(
        pickedDiscount.type === "percent"
          ? Math.round((total * Number(pickedDiscount.value)) / 100)
          : Number(pickedDiscount.value),
        remaining
      )
    : 0;
  // One authoritative discount + remaining for the top line.
  const shownDiscount = discountApplied ? appliedAmount : discountPreview;
  const shownRemaining = discountApplied ? remaining : Math.max(0, remaining - discountPreview);

  const plans = Array.isArray(session?.treatment_plans)
    ? session.treatment_plans
    : [];

  const hasPlans = plans.length > 0;

  const normalNumeric = Number(normalAmount || 0);
  const payNormal =
    normalAmount !== "" && Number.isFinite(normalNumeric) && normalNumeric > 0;

  // const isNormalBelowMin = payNormal && normalNumeric < minTotal;

  // Build planPayments + validation (no memo)
  const planPaymentsArray = [];
  const planErrors = {};

  for (const p of plans) {
    const pid = String(p.id);
    const raw = planAmounts[pid];

    if (raw == null || raw === "") continue;

    const amt = Number(raw);
    const remaining = Number(p.agreed_total) - Number(p.total_paid);

    if (!Number.isFinite(amt) || amt <= 0) {
      planErrors[pid] = t("appt.pay_invalid");
      continue;
    }

    if (amt > remaining) {
      planErrors[pid] = t("appt.pay_exceed", { amount: formatMoney(remaining, curr) });
      continue;
    }

    planPaymentsArray.push({ plan_id: Number(pid), amount: amt });
  }

  const payPlans = planPaymentsArray.length > 0;
  // const noPaymentProvided = !payNormal && !payPlans;
  const hasPlanErrors = Object.keys(planErrors).length > 0;

  // the server refuses more than what is still owed — say it before sending
  const normalTooMuch = payNormal && normalNumeric > remaining;

  const disableSubmit =
    isSubmitting || hasPlanErrors || normalTooMuch;

  const handleChangePlanAmount = (planId, value) => {
    setPlanAmounts((prev) => ({ ...prev, [String(planId)]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (disableSubmit) return;

    const payload = {
      normalAmount: payNormal ? normalNumeric : null,
      planPayments: payPlans ? planPaymentsArray : [],
      note: note || null,
      settleNormal,
      discountId: discountId ? Number(discountId) : null,
    };

    try {
      setIsSubmitting(true);

      await paySession(session.session_id, payload);

      onPaid?.();
      onClose?.();
    } catch (err) {
      toast.error(err.userMessage || t("appt.pay_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-pop">
        {/* Header */}
        <div className="-mx-5 -mt-5 mb-4 flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">{t("appt.pay_title")}</h2>
            <p className="mt-0.5 break-words text-xs text-slate-500">
              {session?.patient?.full_name || t("appt.pay_patient")} · Dr.{" "}
              {session?.doctor?.full_name || t("appt.pay_doctor")}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        {/* Works summary */}
        <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("appt.pay_works")}
          </p>

          {session?.works_summary?.works?.length ? (
            <ul className="space-y-2">
              {session.works_summary.works.map((w, idx) => (
                <li
                  key={`${w.work_name}-${idx}`}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="min-w-0 break-words">
                    {w.work_name} <span className="text-slate-500">{w.quantity}x</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-slate-900">{formatMoney(w.total_price, curr)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>{t("appt.pay_no_works")}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-xs">
            <span className="text-slate-600">
              {t("appt.pay_min_total")} <span className="font-semibold tabular-nums text-slate-900">{formatMoney(minTotal, curr)}</span>
            </span>
            <span className="text-slate-600">
              {t("appt.pay_total")} <span className="text-sm font-bold tabular-nums text-slate-900">{formatMoney(total, curr)}</span>
            </span>
          </div>
        </div>

        {/* Treatment plans */}
        {hasPlans && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-slate-900">
              {t("appt.pay_plans_title")}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              {t("appt.pay_plans_hint")}
            </p>

            <div className="mt-3 space-y-3">
              {plans.map((p) => {
                const remaining = Number(p.agreed_total) - Number(p.total_paid);
                const pid = String(p.id);

                return (
                  <div
                    key={p.id}
                    className="rounded-xl border border-amber-100 bg-white p-3.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {String(p.type || "").toUpperCase()} {t("appt.pay_plan_suffix")}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-600">
                          {t("appt.pay_agreed")} <b>{formatMoney(p.agreed_total, curr)}</b> · {t("appt.pay_paid")}{" "}
                          <b>{formatMoney(p.total_paid, curr)}</b> · {t("appt.pay_remaining")}{" "}
                          <b>{formatMoney(remaining, curr)}</b>
                        </p>
                      </div>

                      <div className="w-full sm:w-44">
                        <label className="mb-1 block text-xs font-medium text-slate-700">
                          {t("appt.pay_amount_plan")}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={planAmounts[pid] ?? ""}
                          onChange={(e) => handleChangePlanAmount(pid, e.target.value)}
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-sm tabular-nums text-slate-900 outline-none transition focus:ring-4 ${
                            planErrors[pid]
                              ? "border-red-400 bg-red-50 focus:ring-red-100"
                              : "border-slate-200 bg-white focus:border-brand focus:ring-brand/15"
                          }`}
                          placeholder="0"
                        />
                        {planErrors[pid] && (
                          <p className="mt-1 text-xs text-red-600">
                            {planErrors[pid]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Normal payment (hidden once the normal balance is settled/fully paid) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!normalSettled && (
            <>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t("appt.pay_normal_label")}
            </label>
            <p className="mb-2 text-xs text-slate-600">
              {t("appt.pay_paid")} <b>{formatMoney(totalPaid, curr)}</b>
              {shownDiscount > 0 && (
                <span className="text-emerald-700"> · {t("appt.pay_discount_applied", { amount: formatMoney(shownDiscount, curr) })}</span>
              )}
              {" · "}{t("appt.pay_remaining")} <b>{formatMoney(shownRemaining, curr)}</b>
            </p>
            <input
              type="number"
              min="0"
              step="1"
              value={normalAmount}
              onChange={(e) => setNormalAmount(e.target.value)}
              className={`w-full px-3.5 py-2.5 tabular-nums rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15`}
              placeholder={shownRemaining ? String(shownRemaining) : t("appt.pay_enter_amount")}
            />
            {normalTooMuch && (
              <p className="mt-1 text-xs text-red-600">{t("appt.pay_exceed", { amount: formatMoney(remaining, curr) })}</p>
            )}
            
            
          </div>

          {discountApplied ? (
            // A discount is already locked onto this session — show it, no re-pick.
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">{t("appt.pay_discount")}</label>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
                <span className="font-medium">{appliedName || t("appt.pay_discount")}</span>
                <span className="shrink-0 font-semibold tabular-nums">−{formatMoney(appliedAmount, curr)}</span>
              </div>
            </div>
          ) : remaining > 0 && usableDiscounts.length > 0 ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">{t("appt.pay_discount")}</label>
              <select
                value={discountId}
                onChange={(e) => setDiscountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
              >
                <option value="">{t("appt.pay_no_discount")}</option>
                {usableDiscounts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.type === "percent" ? `${d.value}%` : formatMoney(d.value, curr)})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {remaining > 0 && canSettle && (
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-100">
              <input
                type="checkbox"
                checked={settleNormal}
                onChange={(e) => setSettleNormal(e.target.checked)}
                className="h-4 w-4 shrink-0 accent-brand"
              />
              {t("appt.pay_settle_done")}
            </label>
          )}
            </>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("appt.pay_note_label")}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
              placeholder={t("appt.pay_note_ph")}
            />
          </div>

          <div className="-mx-5 -mb-5 mt-4 flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={disableSubmit}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition
                ${ disableSubmit ? "bg-brand/50 cursor-not-allowed" : "bg-brand hover:bg-brand-dark"}
                  `}
            >
              {isSubmitting ? t("appt.pay_saving") : t("appt.pay_save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
