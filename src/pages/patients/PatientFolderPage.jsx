import { useEffect, useMemo, useState } from "react";
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
import { useAuth } from "../../context/AuthContext";
import PatientShareBox from "../../components/patients/PatientShareBox";
import { getPatientShares } from "../../api/patientApi";
import PageHeader from "../../components/common/PageHeader";


export default function PatientFolderPage() {
  const { t } = useTranslation();
  const { formatDateTime, formatMoney } = useSettings();
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // home branch + sharing (only the home branch edits the patient's details)
  const [shares, setShares] = useState(null);
  const loadShares = () => getPatientShares(patientId).then((res) => setShares(res.data)).catch(() => setShares(null));
  useEffect(() => { loadShares(); }, [patientId]); // eslint-disable-line react-hooks/exhaustive-deps
  const canEditPatient = (user?.permissions || []).includes("update_patient") && shares?.is_home !== false;
  // a record from another branch (shared patient) is read-only here
  const isHere = (row) => !row.branch_id || Number(row.branch_id) === Number(user?.branch_id);

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
  const { appointments, isLoading: isApptsLoading, error: apptsError, refresh: refreshAppointments } =
    usePatientAppointments(patientId);

  const { sessions, isLoading: isSessionsLoading, error: sessionsError, refresh: refreshSessions } =
    usePatientSessions(patientId);

  const { payments, refresh: refreshPayments } = usePatientPayments(patientId);

  // ---- Treatment plans ----
  const { plans, isLoading: isPlansLoading, error: plansError, refresh: refreshPlans } =
    usePatientTreatmentPlans(patientId);

  const { cache: tpSessionsCache, load: loadTpSessions, reload: reloadTpSessions } =
    useTreatmentPlanSessions();

  // After a session is edited (from the Sessions tab or a plan's sub-table),
  // refresh everything it can change: sessions, plans, the open plan's
  // sub-table, the total paid (payments) and appointments (a deleted visit).
  const handleSessionUpdated = () => {
    refreshSessions();
    refreshPlans();
    refreshPayments();
    refreshAppointments();
    if (expandedPlanId != null) reloadTpSessions(expandedPlanId);
  };

  // payments has normal (session) and treatment-plan payments, split by kind
  const sumPaid = (list) => list.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const paymentsHere = payments.filter(isHere);
  const planPaidForPatient = sumPaid(paymentsHere.filter((p) => p.kind === "plan"));
  const normalPaidForPatient = sumPaid(paymentsHere.filter((p) => p.kind !== "plan"));
  const totalPaidForPatient = sumPaid(paymentsHere);

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
    <div className="w-full space-y-5">
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
      <PageHeader title={t("patient_folder.title")} subtitle={t("patient_folder.subtitle")} />

      {/* Patient info card — general + medical info together at the top */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
        {isPatientLoading && <p className="py-6 text-center text-sm text-slate-500">{t("patient_folder.loading_patient")}</p>}
        {patientError && <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{patientError}</p>}
        {patient && (
          <div className="space-y-4">
            {/* General info */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="break-words text-lg font-bold tracking-tight text-slate-900">{patient.name}</p>
                {/* Phones: main first, extra ones below it */}
                <div className="mt-1.5 flex gap-1 text-sm text-slate-600">
                  <span>{t("patient_folder.phone")}:</span>
                  <div>
                    {[patient.phone, ...(patient.extra_phones || [])].map((ph) => (
                      <p key={ph} className="font-medium tabular-nums text-slate-900">{ph}</p>
                    ))}
                  </div>
                </div>
                <p className="mt-1.5 break-words text-sm text-slate-600">
                  {patient.age && (
                    <>
                      {t("patient_folder.age")}: <span className="font-medium">{patient.age}</span>
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
              <div className="flex flex-col items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-end text-sm text-slate-500">
                <p>
                  {t("patient_folder.total_payments")}:{" "}
                  <span className="text-lg font-bold tabular-nums text-brand">
                    {formatMoney(totalPaidForPatient)}
                  </span>
                </p>
                <p className="text-xs tabular-nums text-slate-500">
                  {t("patient_folder.normal_payments")}: {formatMoney(normalPaidForPatient)}
                  {" · "}
                  {t("patient_folder.plan_payments")}: {formatMoney(planPaidForPatient)}
                </p>
                {canEditPatient && (
                  <button
                    type="button"
                    onClick={() => navigate(`/patients/${patientId}/edit`, { state: { returnTo: `/patients/${patientId}` } })}
                    className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {t("patient_folder.edit_patient")}
                  </button>
                )}
              </div>
            </div>

            <PatientShareBox patientId={patientId} shares={shares} onChanged={loadShares} />

            {/* Medical info — same card, highlighted so it can't be missed */}
            {(patient.blood_type || patient.allergies || patient.chronic_diseases) && (
              <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
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
      <div className="inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-card">
        {["appointments", "sessions", "treatment_plans"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 font-semibold transition ${
              activeTab === tab
                ? "bg-brand text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t(`patient_folder.tab_${tab}`)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
        {/* ---- Appointments ---- */}
        {activeTab === "appointments" && (
          <>
            {apptsError && <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{apptsError}</p>}
            {isApptsLoading && <p className="py-10 text-center text-sm text-slate-500">{t("patient_folder.loading_appointments")}</p>}
            {!isApptsLoading && appointments.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">{t("patient_folder.no_appointments")}</p>
            )}

            {appointments.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3 text-start">{t("patient_folder.col_datetime")}</th>
                      <th className="px-4 py-3 text-start">{t("patient_folder.col_doctor")}</th>
                      <th className="px-4 py-3 text-start">{t("patient_folder.col_status")}</th>
                      <th className="px-4 py-3 text-start">{t("patient_folder.col_created_by")}</th>
                      <th className="px-4 py-3 text-end">{t("patient_folder.col_actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => (
                      <tr
                        key={a.appointment_id}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-slate-900">
                          {formatDateTime(a.scheduled_start)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{a.doctor_name}</td>
                        <td className="px-4 py-3 text-slate-700 capitalize">{a.status}</td>
                        <td className="px-4 py-3 text-slate-700">{a.created_by_name}</td>
                        <td className="px-4 py-3 text-end">
                          {!isHere(a) ? <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700" title={t("share.other_branch_hint")}>{a.branch_name}</span> : (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedDetailsId(a.appointment_id)}
                              className="inline-flex items-center rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark"
                            >
                              {t("common.view")}
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/appointments/${a.appointment_id}/edit`)}
                              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              {t("common.edit")}
                            </button>
                          </div>
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

        {/* ---- Sessions ---- */}
        {activeTab === "sessions" && (
          <>
            {sessionsError && <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{sessionsError}</p>}
            {isSessionsLoading && <p className="py-10 text-center text-sm text-slate-500">{t("patient_folder.loading_sessions")}</p>}
            {!isSessionsLoading && sessions.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">{t("patient_folder.no_sessions")}</p>
            )}

            {sessions.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3 text-start">{t("patient_folder.col_date")}</th>
                      <th className="px-4 py-3 text-start">{t("patient_folder.col_doctor")}</th>
                      <th className="px-4 py-3 text-start">{t("patient_folder.col_status")}</th>
                      <th className="px-4 py-3 text-start">{t("patient_folder.col_total")}</th>
                      <th className="px-4 py-3 text-start">{t("patient_folder.col_paid")}</th>
                      <th className="px-4 py-3 text-end">{t("patient_folder.col_actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr
                        key={s.session_id}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-slate-900">{formatDateTime(s.created_at)}</td>
                        <td className="px-4 py-3 text-slate-700">{s.doctor_name}</td>
                        <td className="px-4 py-3 text-slate-700 capitalize">
                          {s.status || s.appointment_status || "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-slate-900">{formatMoney(s.total, s.currency_code)}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {s.is_paid ? (
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                              {t("patient_folder.paid")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                              {t("patient_folder.not_paid")}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-end">
                          {!isHere(s) ? <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700" title={t("share.other_branch_hint")}>{s.branch_name}</span> : (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedSessionId(s.session_id)}
                              className="inline-flex items-center rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark"
                            >
                              {t("common.view")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditSessionId(s.session_id)}
                              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              {t("common.edit")}
                            </button>
                          </div>
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

        {/* ---- Treatment Plans ---- */}
        {activeTab === "treatment_plans" && (
          <>
            {/* Filter chips */}
            <div className="mb-4 inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 text-xs">
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
                  className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                    tpFilter === f.key
                      ? "bg-brand text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {plansError && <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{plansError}</p>}
            {isPlansLoading && <p className="py-10 text-center text-sm text-slate-500">{t("patient_folder.loading_plans")}</p>}
            {!isPlansLoading && filteredPlans.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">{t("patient_folder.no_plans")}</p>
            )}

            {filteredPlans.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3 text-start">{t("patient_folder.col_type")}</th>
                      <th className="px-4 py-3 text-start">{t("patient_folder.col_agreed")}</th>
                      <th className="px-4 py-3 text-start">{t("patient_folder.col_paid")}</th>
                      <th className="px-4 py-3 text-start">{t("patient_folder.col_remaining")}</th>
                      <th className="px-4 py-3 text-start">{t("patient_folder.col_status")}</th>
                      <th className="px-4 py-3 text-start">{t("patient_folder.col_active")}</th>
                      <th className="px-4 py-3 text-start">{t("patient_folder.col_created")}</th>
                      <th className="px-4 py-3 text-end">{t("patient_folder.col_actions")}</th>
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
                            onClick={() => isHere(tp) && handleTogglePlan(tp.id)}
                            className={`border-t border-slate-100 hover:bg-slate-50 ${isHere(tp) ? "cursor-pointer" : ""}`}
                          >
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {String(tp.type || "").toUpperCase()}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-slate-900">{formatMoney(tp.agreed_total, tp.currency_code)}</td>
                            <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-slate-900">{formatMoney(tp.total_paid, tp.currency_code)}</td>
                            <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-slate-900">{formatMoney(tp.remaining, tp.currency_code)}</td>
                            <td className="px-4 py-3">
                              {tp.is_paid ? (
                                <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                                  {t("patient_folder.paid")}
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                                  {t("patient_folder.due")}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {tp.is_completed ? (
                                <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                                  {t("patient_folder.done")}
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                                  {t("patient_folder.still_active")}
                                </span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDateTime(tp.created_at)}</td>
                            <td className="px-4 py-3 text-end">
                              {!isHere(tp) ? <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700" title={t("share.other_branch_hint")}>{tp.branch_name}</span> : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditPlan(tp);
                                }}
                                className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                {t("common.edit")}
                              </button>
                              )}
                            </td>
                          </tr>

                          {isOpen && (
                            <tr key={`${tp.id}-details`} className="border-t border-slate-100">
                              <td colSpan={8} className="bg-slate-50 px-4 py-3">
                                <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                                  <p className="mb-2 text-sm font-semibold text-slate-900">
                                    {t("patient_folder.sessions_for_plan")}
                                  </p>

                                  {loading && (
                                    <p className="py-10 text-center text-sm text-slate-500">{t("patient_folder.loading_sessions")}</p>
                                  )}

                                  {!loading && err && (
                                    <p className="text-xs text-red-600">{err}</p>
                                  )}

                                  {!loading && !err && planSessions.length === 0 && (
                                    <p className="text-xs text-slate-500">{t("patient_folder.no_sessions_plan")}</p>
                                  )}

                                  {!loading && !err && planSessions.length > 0 && (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-start text-sm">
                                        <thead className="bg-slate-50">
                                          <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            <th className="px-3 py-2.5 text-start">{t("patient_folder.col_finished")}</th>
                                            <th className="px-3 py-2.5 text-start">{t("patient_folder.col_paid_session")}</th>
                                            <th className="px-3 py-2.5 text-start">{t("patient_folder.col_next_plan")}</th>
                                            <th className="px-3 py-2.5 text-start">{t("patient_folder.col_notes")}</th>
                                            <th className="px-3 py-2.5 text-end">{t("patient_folder.col_actions")}</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {planSessions.map((s) => (
                                            <tr
                                              key={s.session_id}
                                              className="border-t border-slate-100 hover:bg-slate-50"
                                              onClick={(e) => {
                                                e.stopPropagation(); // IMPORTANT: prevent toggling plan row again
                                                setSelectedSessionId(s.session_id);
                                              }}
                                            >
                                              <td className="px-3 py-2.5 text-slate-700">
                                                {formatDateTime(s.finished_at)}
                                              </td>
                                              <td className="px-3 py-2.5 text-slate-800 font-medium">
                                                {formatMoney(s.paid_for_this_plan_in_this_session, tp.currency_code)}
                                              </td>
                                              <td className="px-3 py-2.5 text-slate-700">{s.next_plan || "-"}</td>
                                              <td className="px-3 py-2.5 text-slate-700">{s.notes || "-"}</td>
                                              <td className="px-3 py-2.5 text-end">
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditSessionId(s.session_id);
                                                  }}
                                                  className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
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
