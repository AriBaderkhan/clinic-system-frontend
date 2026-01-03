// src/components/appointments/AppointmentDetailsModal.jsx
import { useState } from "react";
import useAppointmentById from "../../hooks/useAppointmentById";
import useAppointmentSession from "../../hooks/useAppointmentSession";
import SessionDetailsModalForDocs from "../../components/sessions/SessionDetailsModalForDocs";

function formatDateTime(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
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
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-100";
    case "no_show":
      return "bg-slate-50 text-slate-600 border-slate-100";
    default:
      return "bg-slate-50 text-slate-600 border-slate-100";
  }
}

function AppointmentDetailsModal({ appointmentId, onClose }) {
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

      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
        <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
          {/* Header */}
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Appointment details
              </h2>

              {appointment && (
                <p className="mt-1 text-[11px] text-slate-500">
                  {appointment.patient_name} ·{" "}
                  {appointment.patient_phone || "No phone"}
                  <br />
                  {appointment.doctor_name} ·{" "}
                  {formatDateTime(appointment.scheduled_start)}
                </p>
              )}
            </div>

            <button
              type="button"
              className="text-xs text-slate-400 hover:text-slate-600"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          {/* Loading / error */}
          {isLoading && (
            <p className="text-xs text-slate-500">Loading appointment…</p>
          )}

          {error && !isLoading && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          {/* Content */}
          {!isLoading && !error && appointment && (
            <div className="space-y-4 text-sm text-slate-800">
              {/* Top row: Status + type + created_at */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-[11px] font-medium uppercase text-slate-500">
                    Status
                  </p>
                  <span
                    className={
                      "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium capitalize " +
                      statusBadgeClasses(appointment.status)
                    }
                  >
                    {appointment.status?.replace("_", " ")}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-medium uppercase text-slate-500">
                    Appointment type
                  </p>
                  <p className="text-xs text-slate-700 capitalize">
                    {appointment.appointment_type || "-"}
                    {appointment.is_walk_in && " · walk-in"}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-medium uppercase text-slate-500">
                    Created at
                  </p>
                  <p className="text-xs text-slate-700">
                    {formatDateTime(appointment.created_at)}
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-[11px] font-medium uppercase text-slate-500">
                    Check-in time
                  </p>
                  <p className="text-xs text-slate-700">
                    {formatDateTime(appointment.check_in_time)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-medium uppercase text-slate-500">
                    Started at
                  </p>
                  <p className="text-xs text-slate-700">
                    {formatDateTime(appointment.started_at)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-medium uppercase text-slate-500">
                    Finished at
                  </p>
                  <p className="text-xs text-slate-700">
                    {formatDateTime(appointment.finished_at)}
                  </p>
                </div>
              </div>

              {/* Cancel / no-show reason */}
              {(appointment.status === "cancelled" ||
                appointment.status === "no_show") && (
                <div className="space-y-1">
                  <p className="text-[11px] font-medium uppercase text-slate-500">
                    {appointment.status === "cancelled"
                      ? "Cancel reason"
                      : "No-show reason"}
                  </p>
                  <p className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                    {appointment.cancel_reason || "-"}
                  </p>
                </div>
              )}

              {/* Session link */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase text-slate-500">
                      Session
                    </p>

                    {isSessionLoading && (
                      <p className="mt-1 text-xs text-slate-500">
                        Checking session…
                      </p>
                    )}

                    {!isSessionLoading && sessionError && (
                      <p className="mt-1 text-xs text-red-600">{sessionError}</p>
                    )}

                    {!isSessionLoading && !sessionError && !sessionId && (
                      <p className="mt-1 text-xs text-slate-600">
                        No session created yet for this appointment.
                      </p>
                    )}

                    {!isSessionLoading && !sessionError && sessionId && (
                      <p className="mt-1 text-xs text-slate-700">
                        Session exists • ID:{" "}
                        <span className="font-semibold">{sessionId}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <button
                      type="button"
                      disabled={!sessionId}
                      onClick={() => setOpenSessionModal(true)}
                      className={`rounded-md px-3 py-1.5 text-[11px] font-medium ${
                        sessionId
                          ? "bg-[#1DB954] text-white hover:bg-emerald-600"
                          : "bg-slate-200 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      View session
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !error && !appointment && (
            <p className="text-xs text-slate-500">
              Appointment not found or could not be loaded.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default AppointmentDetailsModal;
