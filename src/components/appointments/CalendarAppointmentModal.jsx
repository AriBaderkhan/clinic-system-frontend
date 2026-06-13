import { useState } from "react";
import usePatientSessions from "../../hooks/usePatientSessions";
import SessionDetailsModalForDocs from "../sessions/SessionDetailsModalForDocs";
import { getDoctorColor } from "../../utils/doctorColors";

import { useSettings } from "../../context/SettingContext";

function formatMoney(value) {
  const n = Number(value) || 0;
  return n.toLocaleString();
}

function statusBadgeClasses(status) {
  switch (status) {
    case "scheduled":
      return "bg-sky-50 text-sky-700 border-sky-100";
    case "checked_in":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "in_progress":
      return "bg-purple-50 text-purple-700 border-purple-100";
    case "completed":
      return "bg-[#015478]/10 text-[#015478] border-[#015478]/20";
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-100";
    case "no_show":
      return "bg-slate-50 text-slate-600 border-slate-100";
    default:
      return "bg-slate-50 text-slate-600 border-slate-100";
  }
}

export default function CalendarAppointmentModal({ appointment, onClose }) {
  const { formatDateTime } = useSettings();
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
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
          {/* Header strip with doctor color */}
          <div
            className="rounded-t-2xl px-5 py-4 text-white"
            style={{ backgroundColor: color.bg }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">{appointment.patient_name}</h2>
                <p className="mt-0.5 text-[11px] text-white/80">
                  {appointment.patient_phone || "No phone"} · Dr.{" "}
                  <span className="capitalize">{appointment.doctor_name}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-white/80">
                  {formatDateTime(appointment.scheduled_start)}
                </p>
              </div>
              <button
                type="button"
                className="rounded-full bg-white/15 px-2.5 py-1 text-xs text-white hover:bg-white/25"
                onClick={onClose}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            {/* Status + type */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={
                  "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium capitalize " +
                  statusBadgeClasses(appointment.status)
                }
              >
                {appointment.status?.replace("_", " ")}
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] capitalize text-slate-600">
                {appointment.appointment_type || "-"}
              </span>
            </div>

            {/* Last 5 sessions */}
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase text-slate-500">
                Last 5 sessions for {appointment.patient_name}
              </p>

              {isLoading && (
                <p className="text-xs text-slate-500">Loading sessions…</p>
              )}

              {error && !isLoading && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {error}
                </div>
              )}

              {!isLoading && !error && sessions.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-xs text-slate-500">
                  No sessions yet for this patient.
                </div>
              )}

              {!isLoading && !error && sessions.length > 0 && (
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <div
                      key={s.session_id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-800">
                          {formatDateTime(s.created_at)}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500 capitalize">
                          Dr. {s.doctor_name} · Total: {formatMoney(s.total)} · Paid:{" "}
                          {formatMoney(s.total_paid)}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${
                            s.is_paid
                              ? "border-green-100 bg-green-50 text-green-700"
                              : "border-amber-100 bg-amber-50 text-amber-700"
                          }`}
                        >
                          {s.is_paid ? "Paid" : "Unpaid"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedSessionId(s.session_id)}
                          className="rounded-md bg-[#015478] px-3 py-1 text-[11px] font-medium text-white hover:bg-[#013d58]"
                        >
                          View
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
