// src/components/appointments/PaySessionModal.jsx
import { useState } from "react";
import { paySession } from "../../api/sessionApi";

function formatMoney(n) {
  return Number(n || 0).toLocaleString();
}

export default function PaySessionModal({ session, onClose, onPaid }) {
  const [normalAmount, setNormalAmount] = useState("");
  const [note, setNote] = useState("");
  const [planAmounts, setPlanAmounts] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!session) return null;

  const minTotal = Number(session?.totals?.min_total || 0);
  const total = Number(session?.totals?.total || 0);

  const plans = Array.isArray(session?.treatment_plans)
    ? session.treatment_plans
    : [];

  const hasPlans = plans.length > 0;

  const normalNumeric = Number(normalAmount || 0);
  const payNormal =
    normalAmount !== "" && Number.isFinite(normalNumeric) && normalNumeric > 0;

  const isNormalBelowMin = payNormal && normalNumeric < minTotal;

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
      planErrors[pid] = "Invalid amount.";
      continue;
    }

    if (amt > remaining) {
      planErrors[pid] = `Cannot exceed remaining (${formatMoney(remaining)}).`;
      continue;
    }

    planPaymentsArray.push({ plan_id: Number(pid), amount: amt });
  }

  const payPlans = planPaymentsArray.length > 0;
  // const noPaymentProvided = !payNormal && !payPlans;
  const hasPlanErrors = Object.keys(planErrors).length > 0;

  const disableSubmit =
    isSubmitting  || isNormalBelowMin || hasPlanErrors;

  const handleChangePlanAmount = (planId, value) => {
    setPlanAmounts((prev) => ({ ...prev, [String(planId)]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (disableSubmit) return;

    const payload = {
      normalAmount: payNormal ? normalNumeric : null,
      planPayments: payPlans ? planPaymentsArray : [],
      note: note || null,
    };

    try {
      setIsSubmitting(true);

      // IMPORTANT: this must RETURN a response, otherwise you stay on "Saving..."
      await paySession(session.session_id, payload);

      onPaid?.();
      onClose?.();
    } catch (err) {
      console.log(err)
      setError(err?.response?.data?.message || "Failed to save payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Pay session</h2>
            <p className="text-xs text-slate-500">
              {session?.patient?.full_name || "Patient"} · Dr.{" "}
              {session?.doctor?.full_name || "Doctor"}
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
            Works in this session
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
                  <span className="font-medium">{formatMoney(w.total_price)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No works found for this session.</p>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2 text-[11px]">
            <span className="text-slate-600">
              Min total: <span className="font-semibold">{formatMoney(minTotal)}</span>
            </span>
            <span className="text-slate-600">
              Total: <span className="font-semibold">{formatMoney(total)}</span>
            </span>
          </div>
        </div>

        {/* Treatment plans */}
        {hasPlans && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-semibold text-slate-900">
              Treatment plan payments (optional)
            </p>
            <p className="mt-1 text-[11px] text-slate-600">
              Only fill amounts for plans you want to collect today.
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
                          {String(p.type || "").toUpperCase()} plan
                        </p>
                        <p className="text-[11px] text-slate-600">
                          Agreed: <b>{formatMoney(p.agreed_total)}</b> · Paid:{" "}
                          <b>{formatMoney(p.total_paid)}</b> · Remaining:{" "}
                          <b>{formatMoney(remaining)}</b>
                        </p>
                      </div>

                      <div className="w-44">
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">
                          Amount for this plan
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
                              : "border-slate-200 bg-white focus:border-[#1DB954]"
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

        {/* Error */}
        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Normal payment */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Normal session payment (cash) (optional)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={normalAmount}
              onChange={(e) => setNormalAmount(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                isNormalBelowMin
                  ? "border-red-400 bg-red-50"
                  : "border-slate-200 bg-white focus:border-[#1DB954]"
              }`}
              placeholder={total ? String(total) : "Enter amount"}
            />
            {isNormalBelowMin && (
              <p className="text-[11px] text-red-500">
                Amount cannot be less than minimum total ({formatMoney(minTotal)}).
              </p>
            )}
            
            
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Reception note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1DB954]"
              placeholder="e.g. paid full in cash"
            />
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              // disabled={disableSubmit}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold text-white 
                ${ disableSubmit ? "bg-[#1DB954]/50 cursor-not-allowed" : "bg-[#1DB954] hover:bg-[#18a047]"}
                  `}
            >
              {isSubmitting ? "Saving…" : "Save payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
