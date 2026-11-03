import { useState } from "react";
import { useTranslation } from "react-i18next";
import usePatientSessions from "../../hooks/usePatientSessions";
import SessionDetailsModalForDocs from "../sessions/SessionDetailsModalForDocs";
import { getDoctorColor } from "../../utils/doctorColors";

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

export default function CalendarAppointmentModal({ appointment, onClose }) {
  const { t } = useTranslation();
  const { formatDateTime, formatMoney } = useSettings();
  const { sessions, isLoading, error } = usePatientSessions(appointment?.patient_id, 5);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  if (!appointment) return null;

  const color = appointment.doctor_color || getDoctorColor(appointment.doctor_id);

  return (
    <>
      {/* Session details modal */}
      {selectedSessionId && (
        <SessionDetailsModalForDocs
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
        />
      )}

      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-pop">
          {/* Header strip with doctor color */}
          <div
            className="rounded-t-2xl px-5 py-4 text-white"
            style={{ backgroundColor: color.bg }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold">{appointment.patient_name}</h2>
                <p className="mt-0.5 text-xs text-white/80">
                  {appointment.patient_phone || t("appt.no_phone")} · Dr.{" "}
                  <span className="capitalize">{appointment.doctor_name}</span>
                </p>
                <p className="mt-0.5 text-xs tabular-nums text-white/80">
                  {formatDateTime(appointment.scheduled_start)}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-sm text-white transition hover:bg-white/25"
                onClick={onClose}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="space-y-4 px-5 py-4">
            {/* Status + type */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={
                  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize " +
                  statusBadgeClasses(appointment.status)
                }
              >
                {appointment.status?.replace("_", " ")}
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">
                {appointment.appointment_type || "-"}
              </span>
            </div>

            {/* Complaint (from booking) */}
            {appointment.complaint && (
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">{t("appt.complaint_badge")}</p>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-[13px] font-medium text-slate-800">{appointment.complaint}</p>
              </div>
            )}

            {/* Patient medical info — blood type / allergies / chronic diseases */}
            {(appointment.patient_blood_type || appointment.patient_allergies || appointment.patient_chronic_diseases) && (
              <div className="grid gap-2 sm:grid-cols-3">
                {appointment.patient_blood_type && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t("appt.blood_type")}</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">{appointment.patient_blood_type}</p>
                  </div>
                )}
                {appointment.patient_allergies && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700">{t("appt.allergies")}</p>
                    <p className="mt-0.5 text-[13px] font-medium text-slate-800">{appointment.patient_allergies}</p>
                  </div>
                )}
                {appointment.patient_chronic_diseases && (
                  <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">{t("appt.chronic")}</p>
                    <p className="mt-0.5 text-[13px] font-medium text-slate-800">{appointment.patient_chronic_diseases}</p>
                  </div>
                )}
              </div>
            )}

            {/* Last 5 sessions */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("appt.last_5_sessions", { name: appointment.patient_name })}
              </p>

              {isLoading && (
                <p className="py-6 text-center text-sm text-slate-500">{t("appt.loading_sessions")}</p>
              )}

              {error && !isLoading && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}

              {!isLoading && !error && sessions.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  {t("appt.no_sessions_patient")}
                </div>
              )}

              {!isLoading && !error && sessions.length > 0 && (
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <div
                      key={s.session_id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold tabular-nums text-slate-900">
                          {formatDateTime(s.created_at)}
                        </p>
                        <p className="mt-0.5 truncate text-xs capitalize text-slate-500">
                          Dr. {s.doctor_name} · {t("appt.total")}: {formatMoney(s.total, s.currency_code)} · {t("appt.paid")}:{" "}
                          {formatMoney(s.total_paid, s.currency_code)}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            s.is_paid
                              ? "border-green-100 bg-green-50 text-green-700"
                              : "border-amber-100 bg-amber-50 text-amber-700"
                          }`}
                        >
                          {s.is_paid ? t("appt.paid_badge") : t("appt.unpaid_badge")}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedSessionId(s.session_id)}
                          className="inline-flex items-center justify-center rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark"
                        >
                          {t("common.view")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
