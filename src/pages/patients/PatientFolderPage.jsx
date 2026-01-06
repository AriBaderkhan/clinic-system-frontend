// src/pages/patients/PatientFolderPage.jsx
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import usePatientById from "../../hooks/usePatientById";
import usePatientAppointments from "../../hooks/usePatientAppointments";
import usePatientSessions from "../../hooks/usePatientSessions";
import usePatientPayments from "../../hooks/usePatientPayments";

import usePatientTreatmentPlans from "../../hooks/usePatientTreatmentPlans";
import useTreatmentPlanSessions from "../../hooks/useTreatmentPlanSessions";

import SessionDetailsModal from "../../components/sessions/SessionDetailsModal";
import AppointmentDetailsModal from "../../components/appointments/AppointmentDetailsModal";

function formatMoney(n) {
  return Number(n || 0).toLocaleString();
}

function formatDateTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return (
    d.toLocaleDateString() +
    " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

export default function PatientFolderPage() {
  const { patientId } = useParams();

  const [activeTab, setActiveTab] = useState("appointments");
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [selectedDetailsId, setSelectedDetailsId] = useState(null);

  // treatment plans tab state
  const [tpFilter, setTpFilter] = useState("all"); // all | ORTHO | RCT | IMPLANT
  const [expandedPlanId, setExpandedPlanId] = useState(null);

  // ---- Patient top card ----
  const { patient, isLoading: isPatientLoading, error: patientError } =
    usePatientById(patientId);

  // ---- Lists ----
  const { appointments, isLoading: isApptsLoading, error: apptsError } =
    usePatientAppointments(patientId);

  const { sessions, isLoading: isSessionsLoading, error: sessionsError } =
    usePatientSessions(patientId);

  const { payments, isLoading: isPaymentsLoading, error: paymentsError } =
    usePatientPayments(patientId);

  // ---- Treatment plans ----
  const { plans, isLoading: isPlansLoading, error: plansError } =
    usePatientTreatmentPlans(patientId);

  const { cache: tpSessionsCache, load: loadTpSessions } =
    useTreatmentPlanSessions();

  const totalPaidForPatient = payments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  const filteredPlans = useMemo(() => {
    const list = Array.isArray(plans) ? plans : [];
    if (tpFilter === "all") return list;
    return list.filter((p) => String(p.type || "").toUpperCase() === tpFilter);
  }, [plans, tpFilter]);

  const handleTogglePlan = async (planId) => {
    setExpandedPlanId((prev) => (prev === planId ? null : planId));
    await loadTpSessions(planId);
  };

  return (
    <div className="space-y-5">
      {/* Modals */}
      {selectedSessionId && (
        <SessionDetailsModal
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
        />
      )}

      {selectedDetailsId && (
        <AppointmentDetailsModal
          appointmentId={selectedDetailsId}
          onClose={() => setSelectedDetailsId(null)}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Patient Folder</h1>
        <p className="text-xs text-slate-500">
          All appointments, sessions, payments, and treatment plans for this patient in one place.
        </p>
      </div>

      {/* Patient info card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {isPatientLoading && <p className="text-xs text-slate-500">Loading patient…</p>}
        {patientError && <p className="text-xs text-red-600">{patientError}</p>}
        {patient && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">{patient.name}</p>
              <p className="mt-1 text-xs text-slate-600">
                Phone: <span className="font-medium">{patient.phone}</span>
                {patient.age && (
                  <>
                    {" · "}Age: <span className="font-medium">{patient.age}</span>
                  </>
                )}
                {patient.gender && (
                  <>
                    {" · "}Gender:{" "}
                    <span className="font-medium capitalize">{patient.gender}</span>
                  </>
                )}
              </p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>
                Total payments:{" "}
                <span className="font-semibold text-emerald-600">
                  {totalPaidForPatient.toLocaleString()}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-1 text-xs">
        {["appointments", "sessions", "payments", "treatment_plans"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-3 py-1 capitalize ${
              activeTab === tab
                ? "bg-[#1DB954] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {tab === "treatment_plans" ? "Treatment Plans" : tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* ---- Appointments ---- */}
        {activeTab === "appointments" && (
          <>
            {apptsError && <p className="mb-2 text-xs text-red-600">{apptsError}</p>}
            {isApptsLoading && <p className="text-xs text-slate-500">Loading appointments…</p>}
            {!isApptsLoading && appointments.length === 0 && (
              <p className="text-xs text-slate-500">No appointments for this patient yet.</p>
            )}

            {appointments.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] text-slate-500">
                      <th className="px-3 py-2">Date & time</th>
                      <th className="px-3 py-2">Doctor</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Created by</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => (
                      <tr
                        key={a.appointment_id}
                        onClick={() => setSelectedDetailsId(a.appointment_id)}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                      >
                        <td className="px-3 py-2 text-slate-800">
                          {formatDateTime(a.scheduled_start)}
                        </td>
                        <td className="px-3 py-2 text-slate-700">{a.doctor_name}</td>
                        <td className="px-3 py-2 text-slate-700 capitalize">{a.status}</td>
                        <td className="px-3 py-2 text-slate-700">{a.created_by_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ---- Sessions ---- */}
        {activeTab === "sessions" && (
          <>
            {sessionsError && <p className="mb-2 text-xs text-red-600">{sessionsError}</p>}
            {isSessionsLoading && <p className="text-xs text-slate-500">Loading sessions…</p>}
            {!isSessionsLoading && sessions.length === 0 && (
              <p className="text-xs text-slate-500">No sessions for this patient yet.</p>
            )}

            {sessions.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] text-slate-500">
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Doctor</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Total</th>
                      <th className="px-3 py-2">Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr
                        key={s.session_id}
                        onClick={() => setSelectedSessionId(s.session_id)}
                        className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-3 py-2 text-slate-800">{formatDateTime(s.created_at)}</td>
                        <td className="px-3 py-2 text-slate-700">{s.doctor_name}</td>
                        <td className="px-3 py-2 text-slate-700 capitalize">
                          {s.status || s.appointment_status || "-"}
                        </td>
                        <td className="px-3 py-2 text-slate-700">{formatMoney(s.total)}</td>
                        <td className="px-3 py-2 text-slate-700">
                          {s.is_paid ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                              Paid
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                              Not paid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ---- Payments ---- */}
        {activeTab === "payments" && (
          <>
            {paymentsError && <p className="mb-2 text-xs text-red-600">{paymentsError}</p>}
            {isPaymentsLoading && <p className="text-xs text-slate-500">Loading payments…</p>}
            {!isPaymentsLoading && payments.length === 0 && (
              <p className="text-xs text-slate-500">No payments recorded for this patient yet.</p>
            )}

            {payments.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] text-slate-500">
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Method</th>
                      <th className="px-3 py-2">Doctor</th>
                      <th className="px-3 py-2">Processed by</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr
                        key={p.payment_id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-3 py-2 text-slate-800">{formatDateTime(p.created_at)}</td>
                        <td className="px-3 py-2 text-slate-700">{formatMoney(p.amount)}</td>
                        <td className="px-3 py-2 text-slate-700">{p.method || "-"}</td>
                        <td className="px-3 py-2 text-slate-700">{p.doctor_name}</td>
                        <td className="px-3 py-2 text-slate-700">{p.processed_by}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ---- Treatment Plans ---- */}
        {activeTab === "treatment_plans" && (
          <>
            {/* Filter chips */}
            <div className="mb-3 flex flex-wrap gap-2 text-xs">
              {[
                { key: "all", label: "All" },
                { key: "ORTHO", label: "Ortho" },
                { key: "IMPLANT", label: "Implant" },
                { key: "RCT", label: "RCT" },
                { key: "RE_RCT", label: "RE_RCT" },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setTpFilter(f.key)}
                  className={`rounded-full px-3 py-1 ${
                    tpFilter === f.key
                      ? "bg-[#1DB954] text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {plansError && <p className="mb-2 text-xs text-red-600">{plansError}</p>}
            {isPlansLoading && <p className="text-xs text-slate-500">Loading treatment plans…</p>}
            {!isPlansLoading && filteredPlans.length === 0 && (
              <p className="text-xs text-slate-500">No treatment plans found.</p>
            )}

            {filteredPlans.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] text-slate-500">
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Agreed</th>
                      <th className="px-3 py-2">Paid</th>
                      <th className="px-3 py-2">Remaining</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">active</th>
                      <th className="px-3 py-2">Created</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredPlans.map((tp) => {
                      const isOpen = expandedPlanId === tp.id;
                      const cacheKey = String(tp.id);
                      const sessState = tpSessionsCache[cacheKey];
                      const loading = sessState?.loading;
                      const err = sessState?.error;
                      const planSessions = sessState?.sessions || [];

                      return (
                        <>
                          <tr
                            key={tp.id}
                            onClick={() => handleTogglePlan(tp.id)}
                            className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="px-3 py-2 font-medium text-slate-800">
                              {String(tp.type || "").toUpperCase()}
                            </td>
                            <td className="px-3 py-2 text-slate-700">{formatMoney(tp.agreed_total)}</td>
                            <td className="px-3 py-2 text-slate-700">{formatMoney(tp.total_paid)}</td>
                            <td className="px-3 py-2 text-slate-700">{formatMoney(tp.remaining)}</td>
                            <td className="px-3 py-2">
                              {tp.is_paid ? (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                  Paid
                                </span>
                              ) : (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                  Due
                                </span>
                              )}
                            </td>
                               <td className="px-3 py-2">
                              {tp.is_completed ? (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                  Done
                                </span>
                              ) : (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                  Still Active
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-700">{formatDateTime(tp.created_at)}</td>
                          </tr>

                          {isOpen && (
                            <tr key={`${tp.id}-details`} className="border-b border-slate-100">
                              <td colSpan={6} className="px-3 py-3 bg-slate-50">
                                <div className="rounded-xl border border-slate-200 bg-white p-3">
                                  <p className="mb-2 text-[11px] font-semibold text-slate-600">
                                    Sessions for this plan
                                  </p>

                                  {loading && (
                                    <p className="text-xs text-slate-500">Loading sessions…</p>
                                  )}

                                  {!loading && err && (
                                    <p className="text-xs text-red-600">{err}</p>
                                  )}

                                  {!loading && !err && planSessions.length === 0 && (
                                    <p className="text-xs text-slate-500">No sessions linked to this plan.</p>
                                  )}

                                  {!loading && !err && planSessions.length > 0 && (
                                    <div className="overflow-x-auto">
                                      <table className="min-w-full text-left text-xs">
                                        <thead>
                                          <tr className="border-b border-slate-200 text-[11px] text-slate-500">
                                            <th className="px-2 py-2">Finished</th>
                                            <th className="px-2 py-2">Paid in this session</th>
                                            <th className="px-2 py-2">Next plan</th>
                                            <th className="px-2 py-2">Notes</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {planSessions.map((s) => (
                                            <tr
                                              key={s.session_id}
                                              className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                                              onClick={(e) => {
                                                e.stopPropagation(); // IMPORTANT: prevent toggling plan row again
                                                setSelectedSessionId(s.session_id);
                                              }}
                                            >
                                              <td className="px-2 py-2 text-slate-700">
                                                {formatDateTime(s.finished_at)}
                                              </td>
                                              <td className="px-2 py-2 text-slate-800 font-medium">
                                                {formatMoney(s.paid_for_this_plan_in_this_session)}
                                              </td>
                                              <td className="px-2 py-2 text-slate-700">{s.next_plan || "-"}</td>
                                              <td className="px-2 py-2 text-slate-700">{s.notes || "-"}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
