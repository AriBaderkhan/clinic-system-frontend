import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { paySession } from "../../api/sessionApi";
import { getDiscounts } from "../../api/discountApi";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    getDiscounts().then((res) => alive && setDiscounts(res?.data || [])).catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!session) return null;

  const curr = session?.currency_code;
  const minTotal = Number(session?.totals?.min_total || 0);
  const total = Number(session?.totals?.total || 0);
  const totalPaid = Number(session?.totals?.total_paid || 0);
  const remaining = Number(session?.totals?.remaining ?? (total - totalPaid));
  const normalSettled = !!session?.totals?.is_paid; // normal already paid/settled → hide the normal section

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

  //isNormalBelowMin
  const disableSubmit =
    isSubmitting   || hasPlanErrors;

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
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white p-4 sm:p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{t("appt.pay_title")}</h2>
            <p className="text-xs text-slate-500">
              {session?.patient?.full_name || t("appt.pay_patient")} · Dr.{" "}
              {session?.doctor?.full_name || t("appt.pay_doctor")}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500 hover:bg-slate-200"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        {/* Works summary */}
        <div className="mb-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
          <p className="mb-2 text-[11px] font-semibold text-slate-600">
            {t("appt.pay_works")}
          </p>

          {session?.works_summary?.works?.length ? (
            <ul className="space-y-1.5">
              {session.works_summary.works.map((w, idx) => (
                <li
                  key={`${w.work_name}-${idx}`}
                  className="flex items-center justify-between"
                >
                  <span>
                    {w.work_name} <span className="text-slate-500">{w.quantity}x</span>
                  </span>
                  <span className="font-medium">{formatMoney(w.total_price, curr)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>{t("appt.pay_no_works")}</p>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2 text-[11px]">
            <span className="text-slate-600">
              {t("appt.pay_min_total")} <span className="font-semibold">{formatMoney(minTotal, curr)}</span>
            </span>
            <span className="text-slate-600">
              {t("appt.pay_total")} <span className="font-semibold">{formatMoney(total, curr)}</span>
            </span>
          </div>
        </div>

        {/* Treatment plans */}
        {hasPlans && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-semibold text-slate-900">
              {t("appt.pay_plans_title")}
            </p>
            <p className="mt-1 text-[11px] text-slate-600">
              {t("appt.pay_plans_hint")}
            </p>

            <div className="mt-3 space-y-3">
              {plans.map((p) => {
                const remaining = Number(p.agreed_total) - Number(p.total_paid);
                const pid = String(p.id);

                return (
                  <div
                    key={p.id}
                    className="rounded-lg border border-amber-100 bg-white p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-900">
                          {String(p.type || "").toUpperCase()} {t("appt.pay_plan_suffix")}
                        </p>
                        <p className="text-[11px] text-slate-600">
                          {t("appt.pay_agreed")} <b>{formatMoney(p.agreed_total, curr)}</b> · {t("appt.pay_paid")}{" "}
                          <b>{formatMoney(p.total_paid, curr)}</b> · {t("appt.pay_remaining")}{" "}
                          <b>{formatMoney(remaining, curr)}</b>
                        </p>
                      </div>

                      <div className="w-44">
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">
                          {t("appt.pay_amount_plan")}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={planAmounts[pid] ?? ""}
                          onChange={(e) => handleChangePlanAmount(pid, e.target.value)}
                          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                            planErrors[pid]
                              ? "border-red-400 bg-red-50"
                              : "border-slate-200 bg-white focus:border-[#0E6E75]"
                          }`}
                          placeholder="0"
                        />
                        {planErrors[pid] && (
                          <p className="mt-1 text-[11px] text-red-600">
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
        <form onSubmit={handleSubmit} className="space-y-3">
          {!normalSettled && (
            <>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              {t("appt.pay_normal_label")}
            </label>
            <p className="text-[11px] text-slate-600">
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
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none`}
              placeholder={shownRemaining ? String(shownRemaining) : t("appt.pay_enter_amount")}
            />
            {/* {isNormalBelowMin && (
              <p className="text-[11px] text-red-500">
                Amount cannot be less than minimum total ({formatMoney(minTotal)}).
              </p>
            )} */}
            
            
          </div>

          {discountApplied ? (
            // A discount is already locked onto this session — show it, no re-pick.
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">{t("appt.pay_discount")}</label>
              <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                <span className="font-medium">{appliedName || t("appt.pay_discount")}</span>
                <span className="font-semibold">−{formatMoney(appliedAmount, curr)}</span>
              </div>
            </div>
          ) : remaining > 0 && discounts.length > 0 ? (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">{t("appt.pay_discount")}</label>
              <select
                value={discountId}
                onChange={(e) => setDiscountId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0E6E75]"
              >
                <option value="">{t("appt.pay_no_discount")}</option>
                {discounts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.type === "percent" ? `${d.value}%` : formatMoney(d.value, curr)})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {remaining > 0 && (
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={settleNormal}
                onChange={(e) => setSettleNormal(e.target.checked)}
                className="h-4 w-4 accent-[#0E6E75]"
              />
              {t("appt.pay_settle_done")}
            </label>
          )}
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              {t("appt.pay_note_label")}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0E6E75]"
              placeholder={t("appt.pay_note_ph")}
            />
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              // disabled={disableSubmit}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold text-white
                ${ disableSubmit ? "bg-[#0E6E75]/50 cursor-not-allowed" : "bg-[#0E6E75] hover:bg-[#0A565C]"}
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
