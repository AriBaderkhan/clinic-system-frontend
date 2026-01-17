// src/components/appointments/AppointmentStatusModal.jsx
import { useMemo, useState } from "react";
import appointmentApi from "../../api/appointmentApi";

// ---- Allowed transitions ----
function getAllowedNextStatuses(current) {
  switch (current) {
    case "scheduled":
      return ["checked_in", "cancelled", "no_show"];
    case "checked_in":
      return ["in_progress", "cancelled"];
    default:
      return []; // completed / cancelled / no_show
  }
}

const LABELS = {
  scheduled: "Scheduled",
  checked_in: "Checked-in",
  in_progress: "In progress",
  cancelled: "Cancelled",
  no_show: "No show",
};

function AppointmentStatusModal({ appointment, onClose, onUpdated }) {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Force ID extraction cleanly and safely
  const appointmentId = appointment?.id ?? appointment?.appointment_id;

  const allowedStatuses = useMemo(
    () => getAllowedNextStatuses(appointment.status),
    [appointment.status]
  );

  const needsReason =
    selectedStatus === "cancelled" || selectedStatus === "no_show";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!appointmentId) {
      setError("Invalid appointment id.");
      console.log(error)
      return;
    }

    if (!selectedStatus) {
      setError("Choose a new status.");
      return;
    }

    if (needsReason && reason.trim().length < 3) {
      setError("Please write a short reason (min 3 characters).");
      return;
    }

    try {
      setIsSubmitting(true);

      // ---- Call correct API based on new status ----
      if (selectedStatus === "checked_in") {
        await appointmentApi.checkInAppointment(appointmentId);
      } else if (selectedStatus === "in_progress") {
        await appointmentApi.inProgressAppointment(appointmentId);
      } else if (selectedStatus === "cancelled") {
        await appointmentApi.cancelAppointment(appointmentId, {
          cancel_reason: reason,
        });
      } else if (selectedStatus === "no_show") {
        await appointmentApi.noShowAppointment(appointmentId, {
          cancel_reason: reason,
        });
      }

      await onUpdated();
      onClose();
    } catch (err) {
      setError(err.userMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">

        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Update appointment status
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              {appointment.patient_name} · {appointment.patient_phone}
              <br />
              {appointment.doctor_name} ·{" "}
              {new Date(appointment.scheduled_start).toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            className="text-xs text-slate-400 hover:text-slate-600"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        {allowedStatuses.length === 0 ? (
          <p className="text-xs text-slate-500">
            This appointment is <strong>{LABELS[appointment.status]}</strong>.
            Status can no longer be changed.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            
            {/* Status selector */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                New status
              </label>
              <select
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">Select…</option>
                {allowedStatuses.map((s) => (
                  <option key={s} value={s}>
                    {LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason textarea */}
            {needsReason && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  {selectedStatus === "cancelled"
                    ? "Cancel reason"
                    : "No-show reason"}
                </label>
                <textarea
                  className="h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Write short reason..."
                />
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-[#1DB954] px-4 py-1.5 text-xs font-semibold text-white shadow-sm disabled:opacity-60"
              >
                {isSubmitting ? "Saving…" : "Confirm"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default AppointmentStatusModal;
