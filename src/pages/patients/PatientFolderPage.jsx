import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import usePatientById from "../../hooks/usePatientById";
import usePatientAppointments from "../../hooks/usePatientAppointments";
import usePatientSessions from "../../hooks/usePatientSessions";
import usePatientPayments from "../../hooks/usePatientPayments";

import usePatientTreatmentPlans from "../../hooks/usePatientTreatmentPlans";
import useTreatmentPlanSessions from "../../hooks/useTreatmentPlanSessions";

import SessionDetailsModal from "../../components/sessions/SessionDetailsModal";
import EditSessionModal from "../../components/sessions/EditSessionModal";
import EditTreatmentPlanModal from "../../components/treatment_plan/EditTreatmentPlanModal";
import AppointmentDetailsModal from "../../components/appointments/AppointmentDetailsModal";
import { useSettings } from "../../context/SettingContext";

// Edit appointments go to the same edit route the general Appointments page uses;
// the base path depends on the role viewing the folder.
function rolePrefix() {
  const role = localStorage.getItem("role") || "reception";
  return role === "branch_manager" || role === "tenant_manager" ? "/branch" : "/reception";
}

export default function PatientFolderPage() {
  const { t } = useTranslation();
  const { formatDateTime, formatMoney } = useSettings();
  const { patientId } = useParams();
  const navigate = useNavigate();
  const prefix = rolePrefix();

  const [activeTab, setActiveTab] = useState("appointments");
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [selectedDetailsId, setSelectedDetailsId] = useState(null);
  const [editSessionId, setEditSessionId] = useState(null);
  const [editPlan, setEditPlan] = useState(null);

  // treatment plans tab state
  const [tpFilter, setTpFilter] = useState("all"); // all | ORTHO | RCT | IMPLANT
  const [expandedPlanId, setExpandedPlanId] = useState(null);

  // ---- Patient top card ----
  const { patient, isLoading: isPatientLoading, error: patientError } =
    usePatientById(patientId);

  // ---- Lists ----
  const { appointments, isLoading: isApptsLoading, error: apptsError } =
    usePatientAppointments(patientId);

  const { sessions, isLoading: isSessionsLoading, error: sessionsError, refresh: refreshSessions } =
    usePatientSessions(patientId);

  const { payments } = usePatientPayments(patientId);

  // ---- Treatment plans ----
  const { plans, isLoading: isPlansLoading, error: plansError, refresh: refreshPlans } =
    usePatientTreatmentPlans(patientId);

  const { cache: tpSessionsCache, load: loadTpSessions, reload: reloadTpSessions } =
    useTreatmentPlanSessions();

  // After a session is edited (from the Sessions tab or a plan's sub-table),
  // refresh the session list, the plan totals, and the open plan's sub-table.
  const handleSessionUpdated = () => {
    refreshSessions();
    refreshPlans();
    if (expandedPlanId != null) reloadTpSessions(expandedPlanId);
  };

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

      {editSessionId && (
        <EditSessionModal
          sessionId={editSessionId}
          onClose={() => setEditSessionId(null)}
          onUpdated={handleSessionUpdated}
        />
      )}

      {editPlan && (
        <EditTreatmentPlanModal
          plan={editPlan}
          onClose={() => setEditPlan(null)}
          onUpdated={refreshPlans}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{t("patient_folder.title")}</h1>
        <p className="text-xs text-slate-500">
          {t("patient_folder.subtitle")}
        </p>
      </div>

      {/* Patient info card — general + medical info together at the top */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {isPatientLoading && <p className="text-xs text-slate-500">{t("patient_folder.loading_patient")}</p>}
        {patientError && <p className="text-xs text-red-600">{patientError}</p>}
        {patient && (
          <div className="space-y-4">
            {/* General info */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">{patient.name}</p>
                <p className="mt-1 text-xs text-slate-600">
                  {t("patient_folder.phone")}: <span className="font-medium">{patient.phone}</span>
                  {patient.age && (
                    <>
                      {" · "}{t("patient_folder.age")}: <span className="font-medium">{patient.age}</span>
                    </>
                  )}
                  {patient.gender && (
                    <>
                      {" · "}{t("patient_folder.gender")}:{" "}
                      <span className="font-medium capitalize">{patient.gender}</span>
                    </>
                  )}
                  {patient.blood_type && (
                    <>
                      {" · "}{t("patient_folder.blood")}:{" "}
                      <span className="font-medium">{patient.blood_type}</span>
                    </>
                  )}
                  {patient.referral_source && (
                    <>
                      {" · "}{t("patient_folder.source")}:{" "}
                      <span className="font-medium">{patient.referral_source}</span>
                    </>
                  )}
                  {patient.address && (
                    <>
                      {" · "}{t("patient_folder.address")}:{" "}
                      <span className="font-medium">{patient.address}</span>
                    </>
                  )}
                </p>
              </div>
              <div className="text-end text-xs text-slate-500">
                <p>
                  {t("patient_folder.total_payments")}:{" "}
                  <span className="font-semibold text-[#015478]">
                    {formatMoney(totalPaidForPatient)}
                  </span>
                </p>
              </div>
            </div>

            {/* Medical info — same card, highlighted so it can't be missed */}
            {(patient.blood_type || patient.allergies || patient.chronic_diseases) && (
              <div className="grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-3">
                {patient.blood_type && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t("patient_folder.blood_type")}</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">{patient.blood_type}</p>
                  </div>
                )}
                {patient.allergies && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600">{t("patient_folder.allergies")}</p>
                    <p className="mt-0.5 text-sm font-medium text-red-800">{patient.allergies}</p>
                  </div>
                )}
                {patient.chronic_diseases && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">{t("patient_folder.chronic")}</p>
                    <p className="mt-0.5 text-sm font-medium text-amber-800">{patient.chronic_diseases}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1 text-xs">
        {["appointments", "sessions", "treatment_plans"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-3 py-1 ${
              activeTab === tab
                ? "bg-[#015478] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {t(`patient_folder.tab_${tab}`)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* ---- Appointments ---- */}
        {activeTab === "appointments" && (
          <>
            {apptsError && <p className="mb-2 text-xs text-red-600">{apptsError}</p>}
            {isApptsLoading && <p className="text-xs text-slate-500">{t("patient_folder.loading_appointments")}</p>}
            {!isApptsLoading && appointments.length === 0 && (
              <p className="text-xs text-slate-500">{t("patient_folder.no_appointments")}</p>
            )}

            {appointments.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] text-slate-500">
                      <th className="px-3 py-2">{t("patient_folder.col_datetime")}</th>
                      <th className="px-3 py-2">{t("patient_folder.col_doctor")}</th>
                      <th className="px-3 py-2">{t("patient_folder.col_status")}</th>
                      <th className="px-3 py-2">{t("patient_folder.col_created_by")}</th>
                      <th className="px-3 py-2 text-end">{t("patient_folder.col_actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => (
                      <tr
                        key={a.appointment_id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-3 py-2 text-slate-800">
                          {formatDateTime(a.scheduled_start)}
                        </td>
                        <td className="px-3 py-2 text-slate-700">{a.doctor_name}</td>
                        <td className="px-3 py-2 text-slate-700 capitalize">{a.status}</td>
                        <td className="px-3 py-2 text-slate-700">{a.created_by_name}</td>
                        <td className="px-3 py-2 text-end">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedDetailsId(a.appointment_id)}
                              className="rounded-md border border-slate-200 bg-[#015478] px-3 py-1 text-[11px] text-white hover:bg-[#013d58]"
                            >
                              {t("common.view")}
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`${prefix}/appointments/${a.appointment_id}/edit`)}
                              className="rounded-md border border-yellow-200 bg-yellow-600 px-3 py-1 text-[11px] text-white hover:bg-yellow-700"
                            >
                              {t("common.edit")}
                            </button>
                          </div>
                        </td>
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
            {isSessionsLoading && <p className="text-xs text-slate-500">{t("patient_folder.loading_sessions")}</p>}
            {!isSessionsLoading && sessions.length === 0 && (
              <p className="text-xs text-slate-500">{t("patient_folder.no_sessions")}</p>
            )}

            {sessions.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] text-slate-500">
                      <th className="px-3 py-2">{t("patient_folder.col_date")}</th>
                      <th className="px-3 py-2">{t("patient_folder.col_doctor")}</th>
                      <th className="px-3 py-2">{t("patient_folder.col_status")}</th>
                      <th className="px-3 py-2">{t("patient_folder.col_total")}</th>
                      <th className="px-3 py-2">{t("patient_folder.col_paid")}</th>
                      <th className="px-3 py-2 text-end">{t("patient_folder.col_actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr
                        key={s.session_id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-3 py-2 text-slate-800">{formatDateTime(s.created_at)}</td>
                        <td className="px-3 py-2 text-slate-700">{s.doctor_name}</td>
                        <td className="px-3 py-2 text-slate-700 capitalize">
                          {s.status || s.appointment_status || "-"}
                        </td>
                        <td className="px-3 py-2 text-slate-700">{formatMoney(s.total, s.currency_code)}</td>
                        <td className="px-3 py-2 text-slate-700">
                          {s.is_paid ? (
                            <span className="rounded-full bg-[#015478]/10 px-2 py-0.5 text-[11px] font-medium text-[#015478]">
                              {t("patient_folder.paid")}
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                              {t("patient_folder.not_paid")}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-end">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedSessionId(s.session_id)}
                              className="rounded-md border border-slate-200 bg-[#015478] px-3 py-1 text-[11px] text-white hover:bg-[#013d58]"
                            >
                              {t("common.view")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditSessionId(s.session_id)}
                              className="rounded-md border border-yellow-200 bg-yellow-600 px-3 py-1 text-[11px] text-white hover:bg-yellow-700"
                            >
                              {t("common.edit")}
                            </button>
                          </div>
                        </td>
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
                { key: "all", label: t("patient_folder.filter_all") },
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
                      ? "bg-[#015478] text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {plansError && <p className="mb-2 text-xs text-red-600">{plansError}</p>}
            {isPlansLoading && <p className="text-xs text-slate-500">{t("patient_folder.loading_plans")}</p>}
            {!isPlansLoading && filteredPlans.length === 0 && (
              <p className="text-xs text-slate-500">{t("patient_folder.no_plans")}</p>
            )}

            {filteredPlans.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] text-slate-500">
                      <th className="px-3 py-2">{t("patient_folder.col_type")}</th>
                      <th className="px-3 py-2">{t("patient_folder.col_agreed")}</th>
                      <th className="px-3 py-2">{t("patient_folder.col_paid")}</th>
                      <th className="px-3 py-2">{t("patient_folder.col_remaining")}</th>
                      <th className="px-3 py-2">{t("patient_folder.col_status")}</th>
                      <th className="px-3 py-2">{t("patient_folder.col_active")}</th>
                      <th className="px-3 py-2">{t("patient_folder.col_created")}</th>
                      <th className="px-3 py-2 text-end">{t("patient_folder.col_actions")}</th>
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
                            <td className="px-3 py-2 text-slate-700">{formatMoney(tp.agreed_total, tp.currency_code)}</td>
                            <td className="px-3 py-2 text-slate-700">{formatMoney(tp.total_paid, tp.currency_code)}</td>
                            <td className="px-3 py-2 text-slate-700">{formatMoney(tp.remaining, tp.currency_code)}</td>
                            <td className="px-3 py-2">
                              {tp.is_paid ? (
                                <span className="rounded-full bg-[#015478]/10 px-2 py-0.5 text-[11px] font-medium text-[#015478]">
                                  {t("patient_folder.paid")}
                                </span>
                              ) : (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                  {t("patient_folder.due")}
                                </span>
                              )}
                            </td>
                               <td className="px-3 py-2">
                              {tp.is_completed ? (
                                <span className="rounded-full bg-[#015478]/10 px-2 py-0.5 text-[11px] font-medium text-[#015478]">
                                  {t("patient_folder.done")}
                                </span>
                              ) : (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                  {t("patient_folder.still_active")}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-700">{formatDateTime(tp.created_at)}</td>
                            <td className="px-3 py-2 text-end">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditPlan(tp);
                                }}
                                className="rounded-md border border-yellow-200 bg-yellow-600 px-3 py-1 text-[11px] text-white hover:bg-yellow-700"
                              >
                                {t("common.edit")}
                              </button>
                            </td>
                          </tr>

                          {isOpen && (
                            <tr key={`${tp.id}-details`} className="border-b border-slate-100">
                              <td colSpan={8} className="px-3 py-3 bg-slate-50">
                                <div className="rounded-xl border border-slate-200 bg-white p-3">
                                  <p className="mb-2 text-[11px] font-semibold text-slate-600">
                                    {t("patient_folder.sessions_for_plan")}
                                  </p>

                                  {loading && (
                                    <p className="text-xs text-slate-500">{t("patient_folder.loading_sessions")}</p>
                                  )}

                                  {!loading && err && (
                                    <p className="text-xs text-red-600">{err}</p>
                                  )}

                                  {!loading && !err && planSessions.length === 0 && (
                                    <p className="text-xs text-slate-500">{t("patient_folder.no_sessions_plan")}</p>
                                  )}

                                  {!loading && !err && planSessions.length > 0 && (
                                    <div className="overflow-x-auto">
                                      <table className="min-w-full text-left text-xs">
                                        <thead>
                                          <tr className="border-b border-slate-200 text-[11px] text-slate-500">
                                            <th className="px-2 py-2">{t("patient_folder.col_finished")}</th>
                                            <th className="px-2 py-2">{t("patient_folder.col_paid_session")}</th>
                                            <th className="px-2 py-2">{t("patient_folder.col_next_plan")}</th>
                                            <th className="px-2 py-2">{t("patient_folder.col_notes")}</th>
                                            <th className="px-2 py-2 text-end">{t("patient_folder.col_actions")}</th>
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
                                                {formatMoney(s.paid_for_this_plan_in_this_session, tp.currency_code)}
                                              </td>
                                              <td className="px-2 py-2 text-slate-700">{s.next_plan || "-"}</td>
                                              <td className="px-2 py-2 text-slate-700">{s.notes || "-"}</td>
                                              <td className="px-2 py-2 text-end">
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditSessionId(s.session_id);
                                                  }}
                                                  className="rounded-md border border-yellow-200 bg-yellow-600 px-3 py-1 text-[11px] text-white hover:bg-yellow-700"
                                                >
                                                  {t("common.edit")}
                                                </button>
                                              </td>
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
