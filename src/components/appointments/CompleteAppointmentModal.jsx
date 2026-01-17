import { useEffect, useMemo, useState } from "react";
import { completeAppointmentWithSession } from "../../api/appointmentApi";
import { fetchWorkCatalog } from "../../api/workApi";
import { getActiveTreatmentPlan } from "../../api/treatmentPlanApi";

function formatTime(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const TREATMENT_TYPES = ["ortho", "implant", "rct","re_rct"];

export default function CompleteAppointmentModal({ appointment, onClose, onCompleted }) {
  const [nextPlan, setNextPlan] = useState("");
  const [notes, setNotes] = useState("");
  const [works, setWorks] = useState([{ work_id: "", quantity: 1, tooth_number: "" }]);

  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // agreement inputs (only for types that DON'T have active plan)
  const [agreementTotals, setAgreementTotals] = useState({ ortho: "", implant: "", rct: "", re_rct: "" });
  const [agreementErrors, setAgreementErrors] = useState({ ortho: "", implant: "", rct: "", re_rct: "" });
  const [planCompletion, setPlanCompletion] = useState({
    ortho: false,
    implant: false,
    rct: false,
    re_rct: false,
  });

  // active plan state for each type
  // plans[type] = { loading:boolean, plan: object|null }
  const [plans, setPlans] = useState({
    ortho: { loading: false, plan: null },
    implant: { loading: false, plan: null },
    rct: { loading: false, plan: null },
    re_rct: { loading: false, plan: null },
  });

  const apptId = appointment.id ?? appointment.appointment_id;

  // IMPORTANT: we must have patient_id to check active plan
  const patientId = Number(appointment.patient_id);

  // load work catalog
  useEffect(() => {
    (async () => {
      try {
        setLoadingCatalog(true);
        const data = await fetchWorkCatalog();
        setCatalog(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.userMessage);
      } finally {
        setLoadingCatalog(false);
      }
    })();
  }, []);

  // helpers
  const getCatalogMetaById = (workId) => {
    const item = catalog.find((x) => Number(x.id) === Number(workId));
    if (!item) return null;

    const code = String(item.code || "").toLowerCase(); // DB may be uppercase
    return {
      id: Number(item.id),
      name: item.name,
      code,
      min_price: Number(item.min_price || 0),
    };
  };

  // which treatment types are selected right now in the works list
  const selectedTreatmentTypes = useMemo(() => {
    const set = new Set();
    for (const w of works) {
      const meta = getCatalogMetaById(w.work_id);
      if (!meta) continue;
      if (TREATMENT_TYPES.includes(meta.code)) set.add(meta.code);
    }
    return set;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [works, catalog]);

  // When doctor selects a treatment, check if active plan exists (via endpoint)
  useEffect(() => {
    if (!patientId || Number.isNaN(patientId)) return;

    // for each selected type, call endpoint if we haven't loaded it yet
    selectedTreatmentTypes.forEach((type) => {
      // already loading/loaded? skip re-call
      if (plans[type]?.loading) return;

      // We do call again every time selection changes? Better: call and cache.
      // If you want always fresh, remove "plans[type].plan !== null" check.
      if (plans[type]?.plan !== null) return;

      setPlans((prev) => ({ ...prev, [type]: { ...prev[type], loading: true } }));

      getActiveTreatmentPlan(patientId, type)
        .then((plan) => {
          setPlans((prev) => ({ ...prev, [type]: { loading: false, plan: plan || null } }));

          // If plan exists -> clear agreement input for that type (do not show)
          if (plan) {
            setAgreementTotals((prev) => ({ ...prev, [type]: "" }));
            setAgreementErrors((prev) => ({ ...prev, [type]: "" }));
          } else {
            // if no plan exists -> set default agreement to min_price
            const meta = [...works]
              .map((w) => getCatalogMetaById(w.work_id))
              .find((m) => m && m.code === type);

            if (meta) {
              setAgreementTotals((prev) => {
                if (prev[type] !== "" && prev[type] != null) return prev;
                return { ...prev, [type]: meta.min_price };
              });
            }
          }
        })
        .catch((err) => {
          console.error("getActiveTreatmentPlan error", err);
          setPlans((prev) => ({ ...prev, [type]: { loading: false, plan: null } }));
          // don’t block user, but show warning
          setError("Failed to check active treatment plan. Try again.");
        });
    });

    // If a type is unselected, reset cached plan state so it checks again next time
    TREATMENT_TYPES.forEach((t) => {
      if (!selectedTreatmentTypes.has(t)) {
        setPlans((prev) => ({ ...prev, [t]: { loading: false, plan: null } }));
        setAgreementTotals((prev) => ({ ...prev, [t]: "" }));
        setAgreementErrors((prev) => ({ ...prev, [t]: "" }));
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTreatmentTypes, patientId]);

  // Auto-update agreement total when quantity changes
  useEffect(() => {
    selectedTreatmentTypes.forEach((type) => {
      const meta = works
        .map((w) => getCatalogMetaById(w.work_id))
        .find((m) => m && m.code === type);

      if (meta) {
        const qty = works
          .filter((w) => getCatalogMetaById(w.work_id)?.code === type)
          .reduce((sum, w) => sum + Number(w.quantity || 1), 0);

        const minTotal = meta.min_price * qty;

        // Only auto-update if the current value is empty OR 
        // if the current value is less than the new minimum
        setAgreementTotals((prev) => {
          const currentVal = Number(prev[type]);
          if (!currentVal || currentVal < minTotal) {
            return { ...prev, [type]: minTotal };
          }
          return prev;
        });
      }
    });
  }, [works, selectedTreatmentTypes, catalog]);

  const handleChangeWork = (index, field, value) => {
    setWorks((prev) => prev.map((w, i) => (i === index ? { ...w, [field]: value } : w)));
  };

  const handleAddWork = () => {
    setWorks((prev) => [...prev, { work_id: "", quantity: 1, tooth_number: "" }]);
  };

  const handleRemoveWork = (index) => {
    setWorks((prev) => prev.filter((_, i) => i !== index));
  };

  const validateAgreementTotals = () => {
    const errs = { ortho: "", implant: "", rct: "", re_rct: "" };

    // only validate types that are selected AND do NOT have active plan
    selectedTreatmentTypes.forEach((type) => {
      const meta = [...works]
        .map((w) => getCatalogMetaById(w.work_id))
        .find((m) => m && m.code === type);

      if (!meta) return;

      const hasActivePlan = !!plans[type]?.plan;
      if (hasActivePlan) return; // no input required

      const vRaw = agreementTotals[type];
      const v = Number(vRaw);

      if (vRaw === "" || vRaw == null) {
        errs[type] = "Agreement total is required.";
        return;
      }

      if (!Number.isFinite(v) || v <= 0) {
        errs[type] = "Invalid amount.";
        return;
      }

      // if (v < meta.min_price) {
      //   errs[type] = Must be at least ${meta.min_price.toLocaleString()} IQD.;
      // }

      const qty =
        works
          .filter((w) => getCatalogMetaById(w.work_id)?.code === type)
          .reduce((sum, w) => sum + Number(w.quantity ?? 1), 0) || 1;

      const minTotal = meta.min_price * qty;

      if (v < minTotal) {
        errs[type] = `Must be at least ${minTotal.toLocaleString()} IQD.`;
      }
    });

    setAgreementErrors(errs);
    return Object.values(errs).every((x) => !x);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!patientId || Number.isNaN(patientId)) {
      setError("Missing patient_id in appointment object. Fix backend response for in-progress list.");
      return;
    }

    const cleanedWorks = works
      .filter((w) => w.work_id && Number(w.quantity) > 0)
      .map((w) => ({
        work_id: Number(w.work_id),
        quantity: Number(w.quantity),
        tooth_number: w.tooth_number ? Number(w.tooth_number) : null,
      }));

    if (cleanedWorks.length === 0) {
      setError("Please add at least one work with quantity.");
      return;
    }

    // validate agreement totals if needed
    if (selectedTreatmentTypes.size > 0) {
      const ok = validateAgreementTotals();
      if (!ok) return;
    }

    // send agreementTotals ONLY for types that need new plan (no active plan)
    const agreementTotalsPayload = {};
    selectedTreatmentTypes.forEach((type) => {
      const hasActivePlan = !!plans[type]?.plan;
      if (!hasActivePlan) {
        agreementTotalsPayload[type] = Number(agreementTotals[type]);
      }
    });

    const payload = {
      next_plan: nextPlan || null,
      notes: notes || null,
      works: cleanedWorks,
      agreementTotals: agreementTotalsPayload, // could be empty {}
      planCompletion: Object.fromEntries(
        [...selectedTreatmentTypes].map((t) => [t, !!planCompletion[t]])
      ),
    };

    try {
      setSaving(true);
      await completeAppointmentWithSession(apptId, payload);
      onCompleted?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.userMessage);
    } finally {
      setSaving(false);
    }
  };

  // which inputs should be shown? (selected and NO active plan)
  const inputTypes = [...selectedTreatmentTypes].filter((t) => !plans[t]?.plan);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Complete appointment & fill works</h2>
            <p className="mt-1 text-xs text-slate-500">
              {appointment.patient_name} · {appointment.patient_phone}
              <br />
              {appointment.doctor_name} · {new Date(appointment.scheduled_start).toLocaleDateString()} ·{" "}
              {formatTime(appointment.scheduled_start)} · {appointment.appointment_type}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Next plan + Notes */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Next plan (optional)</label>
              <textarea
                value={nextPlan}
                onChange={(e) => setNextPlan(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#1DB954] focus:outline-none focus:ring-1 focus:ring-[#1DB954]"
                placeholder="Short note for next visit…"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#1DB954] focus:outline-none focus:ring-1 focus:ring-[#1DB954]"
                placeholder="Notes about today’s treatment…"
              />
            </div>
          </div>

          {/* Works list */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Works done in this visit</h3>
              <button
                type="button"
                onClick={handleAddWork}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
              >
                + Add work
              </button>
            </div>

            {loadingCatalog && <p className="text-xs text-slate-500">Loading works list…</p>}

            {!loadingCatalog &&
              works.map((w, index) => (
                <div
                  key={index}
                  className="mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Work</label>
                    <select
                      value={w.work_id}
                      onChange={(e) => handleChangeWork(index, "work_id", e.target.value)}
                      className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-[#1DB954] focus:outline-none focus:ring-1 focus:ring-[#1DB954]"
                      required
                    >
                      <option value="">Select…</option>
                      {catalog.map((work) => (
                        <option key={work.id} value={work.id}>
                          {work.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={w.quantity}
                      onChange={(e) => handleChangeWork(index, "quantity", e.target.value)}
                      className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-[#1DB954] focus:outline-none focus:ring-1 focus:ring-[#1DB954]"
                    />
                  </div>

                  <div className="w-28">
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Tooth #</label>
                    <input
                      type="number"
                      min="11"
                      max="48"
                      value={w.tooth_number}
                      onChange={(e) => handleChangeWork(index, "tooth_number", e.target.value)}
                      className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-[#1DB954] focus:outline-none focus:ring-1 focus:ring-[#1DB954]"
                      placeholder="optional"
                    />
                  </div>

                  {works.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveWork(index)}
                      className="mt-5 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-600 hover:bg-red-100"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
          </div>

          {/* Active plan info (so doctor knows it exists) */}
          {selectedTreatmentTypes.size > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Treatment plan status</p>
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                {[...selectedTreatmentTypes].map((type) => {
                  const st = plans[type];
                  const title = type.toUpperCase();

                  if (st?.loading) {
                    return (
                      <div key={type} className="rounded-lg border border-slate-200 bg-white p-3 text-xs">
                        <div className="font-semibold">{title}</div>
                        <div className="text-slate-500 mt-1">Checking active plan…</div>
                      </div>
                    );
                  }

                  if (st?.plan) {
                    return (
                      <div key={type} className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs">
                        <div className="font-semibold">{title}</div>
                        <div className="text-emerald-700 mt-1">Active plan found ✅</div>
                        <label className="mt-2 flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={planCompletion[type]}
                            onChange={(e) =>
                              setPlanCompletion((prev) => ({ ...prev, [type]: e.target.checked }))
                            }
                          />
                          Mark {title} as completed (tamam)
                        </label>
                      </div>

                    );


                  }


                  return (
                    <div key={type} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs">
                      <div className="font-semibold">{title}</div>
                      <div className="text-amber-700 mt-1">No active plan → agreement required</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Agreement inputs ONLY when needed (no active plan) */}
          {inputTypes.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Agreement totals</p>
              <p className="mt-1 text-[11px] text-slate-600">
                Only required when there is NO active plan. Must be ≥ min_price from work_catalog.
              </p>

              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {inputTypes.map((type) => {
                  const meta = [...works]
                    .map((w) => getCatalogMetaById(w.work_id))
                    .find((m) => m && m.code === type);

                  if (!meta) return null;

                  const qty =
                    works
                      .filter(w => getCatalogMetaById(w.work_id)?.code === type)
                      .reduce((sum, w) => sum + Number(w.qty ?? w.quantity ?? 1), 0) || 1;


                  const minTotal = meta.min_price * qty;

                  return (
                    <div key={type} className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-700">
                        {meta.name} agreement total
                      </label>
                      <input
                        type="number"
                        min={minTotal}
                        // This connects the input to the state we updated in the useEffect above
                        value={agreementTotals[type] || ""}
                        onChange={(e) => {
                          // This allows the doctor to manually override the automatic number
                          setAgreementTotals((prev) => ({ ...prev, [type]: e.target.value }));
                          setAgreementErrors((prev) => ({ ...prev, [type]: "" }));
                        }}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#1DB954] focus:outline-none focus:ring-1 focus:ring-[#1DB954]"
                        placeholder={`Min: ${minTotal.toLocaleString()} IQD`}
                      />
                      <p className="text-[11px] text-slate-500">
                        Min: <span className="font-semibold">{meta.min_price.toLocaleString()} × {qty} = {minTotal.toLocaleString()} IQD</span>
                      </p>
                      {agreementErrors[type] && <p className="text-[11px] text-red-600">{agreementErrors[type]}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-[#1DB954] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#18a045] disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Saving…" : "Confirm & Complete"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}