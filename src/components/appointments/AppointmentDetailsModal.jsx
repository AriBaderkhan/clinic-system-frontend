import { useState } from "react";
import { useTranslation } from "react-i18next";
import useAppointmentById from "../../hooks/useAppointmentById";
import useAppointmentSession from "../../hooks/useAppointmentSession";
import SessionDetailsModalForDocs from "../../components/sessions/SessionDetailsModalForDocs";

import { useSettings } from "../../context/SettingContext";

function statusBadgeClasses(status) {
  switch (status) {
    case "scheduled":
      return "bg-sky-50 text-sky-700 border-sky-100";
    case "checked_in":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "in_progress":
      return "bg-purple-50 text-purple-700 border-purple-100";
    case "completed":
      return "bg-brand/10 text-brand border-brand/20";
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-100";
    case "no_show":
      return "bg-slate-50 text-slate-600 border-slate-100";
    default:
      return "bg-slate-50 text-slate-600 border-slate-100";
  }
}

export default function AppointmentDetailsModal({ appointmentId, onClose }) {
  const { t } = useTranslation();
  const { formatDateTime } = useSettings();
  const { appointment, isLoading, error } = useAppointmentById(appointmentId);

  // ---- session lookup by appointment id ----
  const { sessionId, isLoading: isSessionLoading, error: sessionError } =
    useAppointmentSession(appointmentId, true);

  const [openSessionModal, setOpenSessionModal] = useState(false);

  return (
    <>
      {/* Session details modal */}
      {openSessionModal && sessionId && (
        <SessionDetailsModalForDocs
          sessionId={sessionId}
          onClose={() => setOpenSessionModal(false)}
        />
      )}

      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-pop">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900">
                {t("appt.details_title")}
              </h2>

              {appointment && (
                <p className="mt-1 break-words text-xs text-slate-500">
                  {appointment.patient_name} ·{" "}
                  {appointment.patient_phone || t("appt.no_phone")}
                  <br />
                  {appointment.doctor_name} ·{" "}
                  {formatDateTime(appointment.scheduled_start)}
                </p>
              )}
            </div>

            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          <div className="px-5 py-4">

          {/* Loading / error */}
          {isLoading && (
            <p className="py-8 text-center text-sm text-slate-500">{t("appt.loading_appt")}</p>
          )}

          {error && !isLoading && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Content */}
          {!isLoading && !error && appointment && (
            <div className="space-y-4 text-sm text-slate-800">
              {/* Top row: Status + type + created_at */}
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("appt.status")}
                  </p>
                  <span
                    className={
                      "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize " +
                      statusBadgeClasses(appointment.status)
                    }
                  >
                    {appointment.status?.replace("_", " ")}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("appt.appt_type")}
                  </p>
                  <p className="text-sm font-medium capitalize text-slate-900">
                    {appointment.appointment_type || "-"}
                    {appointment.is_walk_in && ` · ${t("appt.walk_in_badge")}`}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("appt.created_at")}
                  </p>
                  <p className="text-sm font-medium tabular-nums text-slate-900">
                    {formatDateTime(appointment.created_at)}
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("appt.checkin_time")}
                  </p>
                  <p className="text-sm font-medium tabular-nums text-slate-900">
                    {formatDateTime(appointment.check_in_time)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("appt.started_at")}
                  </p>
                  <p className="text-sm font-medium tabular-nums text-slate-900">
                    {formatDateTime(appointment.started_at)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("appt.finished_at")}
                  </p>
                  <p className="text-sm font-medium tabular-nums text-slate-900">
                    {formatDateTime(appointment.finished_at)}
                  </p>
                </div>
              </div>

              {/* Complaint */}
              {appointment.complaint && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("appt.complaint")}
                  </p>
                  <p className="whitespace-pre-wrap break-words text-sm text-slate-700">
                    {appointment.complaint}
                  </p>
                </div>
              )}

              {/* Medical info — blood type / allergies / chronic diseases */}
              {(appointment.patient_blood_type ||
                appointment.patient_allergies ||
                appointment.patient_chronic_diseases) && (
                <div className="grid gap-2 sm:grid-cols-3">
                  {appointment.patient_blood_type && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {t("appt.blood_type")}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-800">
                        {appointment.patient_blood_type}
                      </p>
                    </div>
                  )}
                  {appointment.patient_allergies && (
                    <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700">
                        {t("appt.allergies")}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-slate-800">
                        {appointment.patient_allergies}
                      </p>
                    </div>
                  )}
                  {appointment.patient_chronic_diseases && (
                    <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                        {t("appt.chronic")}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-slate-800">
                        {appointment.patient_chronic_diseases}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Cancel / no-show reason */}
              {(appointment.status === "cancelled" ||
                appointment.status === "no_show") && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {appointment.status === "cancelled"
                      ? t("appt.cancel_reason")
                      : t("appt.noshow_reason")}
                  </p>
                  <p className="whitespace-pre-wrap break-words rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    {appointment.cancel_reason || "-"}
                  </p>
                </div>
              )}

              {/* Session link */}
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t("appt.session")}
                    </p>

                    {isSessionLoading && (
                      <p className="mt-1 text-xs text-slate-500">
                        {t("appt.checking_session")}
                      </p>
                    )}

                    {!isSessionLoading && sessionError && (
                      <p className="mt-1 text-xs text-red-600">{sessionError}</p>
                    )}

                    {!isSessionLoading && !sessionError && !sessionId && (
                      <p className="mt-1 text-xs text-slate-600">
                        {t("appt.no_session")}
                      </p>
                    )}

                    {!isSessionLoading && !sessionError && sessionId && (
                      <p className="mt-1 text-xs text-slate-700">
                        {t("appt.session_exists_label")}{" "}
                        <span className="font-semibold">{sessionId}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <button
                      type="button"
                      disabled={!sessionId}
                      onClick={() => setOpenSessionModal(true)}
                      className={`inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                        sessionId
                          ? "bg-brand text-white hover:bg-brand-dark"
                          : "cursor-not-allowed bg-slate-100 text-slate-400"
                      }`}
                    >
                      {t("appt.view_session")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !error && !appointment && (
            <p className="py-8 text-center text-sm text-slate-500">
              {t("appt.appt_not_found")}
            </p>
          )}
          </div>
        </div>
      </div>
    </>
  );
}
