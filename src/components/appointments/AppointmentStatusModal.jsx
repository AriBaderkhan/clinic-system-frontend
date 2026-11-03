import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { checkInAppointment, inProgressAppointment, cancelAppointment, noShowAppointment } from "../../api/appointmentApi";
import { useSettings } from "../../context/SettingContext";

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

const LABEL_KEYS = {
  scheduled: "appt.st_scheduled",
  checked_in: "appt.st_checked_in",
  in_progress: "appt.st_in_progress",
  cancelled: "appt.st_cancelled",
  no_show: "appt.st_no_show",
};

export default function AppointmentStatusModal({ appointment, onClose, onUpdated }) {
  const { t } = useTranslation();
  const { formatDateTime } = useSettings();
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
      setError(t("appt.err_invalid_id"));
      return;
    }

    if (!selectedStatus) {
      setError(t("appt.err_choose_status"));
      return;
    }

    if (needsReason && reason.trim().length < 3) {
      setError(t("appt.err_reason_min"));
      return;
    }

    try {
      setIsSubmitting(true);

      // ---- Call correct API based on new status ----
      if (selectedStatus === "checked_in") {
        await checkInAppointment(appointmentId);
      } else if (selectedStatus === "in_progress") {
        await inProgressAppointment(appointmentId);
      } else if (selectedStatus === "cancelled") {
        await cancelAppointment(appointmentId, { cancel_reason: reason });
      } else if (selectedStatus === "no_show") {
        await noShowAppointment(appointmentId, { cancel_reason: reason });
      }

      await onUpdated();
      onClose();
    } catch (err) {
      toast.error(err.userMessage || t("appt.update_status_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-pop">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">
              {t("appt.status_title")}
            </h2>
            <p className="mt-1 break-words text-xs text-slate-500">
              {appointment.patient_name} · {appointment.patient_phone}
              <br />
              {appointment.doctor_name} ·{" "}
              {formatDateTime(appointment.scheduled_start)}
            </p>
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

        {error && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        {allowedStatuses.length === 0 ? (
          <p className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3 text-sm text-slate-600">
            {t("appt.status_locked", { status: t(LABEL_KEYS[appointment.status] || appointment.status) })}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Status selector */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                {t("appt.new_status")}
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">{t("appt.select_dots")}</option>
                {allowedStatuses.map((s) => (
                  <option key={s} value={s}>
                    {t(LABEL_KEYS[s] || s)}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason textarea */}
            {needsReason && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  {selectedStatus === "cancelled"
                    ? t("appt.cancel_reason")
                    : t("appt.noshow_reason")}
                </label>
                <textarea
                  className="h-24 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t("appt.reason_ph")}
                />
              </div>
            )}

            {/* Buttons */}
            <div className="-mx-5 -mb-4 flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
              >
                {isSubmitting ? t("appt.saving_short") : t("appt.confirm")}
              </button>
            </div>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}
