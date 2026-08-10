import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

// import useActiveTodayAppointments from "../../hooks/useActiveTodayAppointments";
import useActiveApptsTodayPerDoctor from "../../hooks/useActiveApptsTodayPerDoctor";
import useOpenApptsPerDoctor from "../../hooks/useOpenApptsPerDoctor";
import CalendarAppointmentModal from "../../components/appointments/CalendarAppointmentModal";
import CompleteAppointmentModal from "../../components/appointments/CompleteAppointmentModal";
import { inProgressAppointment } from "../../api/appointmentApi";
import { useSettings } from "../../context/SettingContext";

function statusBadgeClasses(status) {
  switch (status) {
    case "scheduled":
      return "bg-sky-50 text-sky-700 border-sky-100";
    case "checked_in":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "in_progress":
      return "bg-purple-50 text-purple-700 border-purple-100";
    default:
      return "bg-slate-50 text-slate-600 border-slate-100";
  }
}

export default function DoctorDashboard() {
  const {
    appointments: todayAppointments,
    isLoading: isTodayLoading,
    error: todayError,
    refresh: refreshToday,
  } = useActiveApptsTodayPerDoctor();

  // All unfinished (in_progress) appointments, any date — for the "unfinished" button.
  const {
    appointments: openAppointments,
    refresh: refreshOpen,
  } = useOpenApptsPerDoctor();

  const { formatTime, formatDateTime } = useSettings();
  const { t } = useTranslation();

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedForComplete, setSelectedForComplete] = useState(null);
  const [showOpen, setShowOpen] = useState(false);
  const [startingId, setStartingId] = useState(null);

  // Doctor moves a checked-in visit to in_progress (the only status change allowed here).
  const handleStart = async (id) => {
    try {
      setStartingId(id);
      await inProgressAppointment(id);
      refreshToday();
      refreshOpen();
    } catch (err) {
      toast.error(err.userMessage || t("dash.start_failed"));
    } finally {
      setStartingId(null);
    }
  };
 

  // only in_progress appointments (for right column)
  const inProgressAppointments = todayAppointments.filter(
    (a) => a.status === "in_progress"
  );

  return (
    <div className="space-y-6">
      {/* Modals */}
      {selectedAppointment && (
        <CalendarAppointmentModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}

      {selectedForComplete && (
        <CompleteAppointmentModal
          appointment={selectedForComplete}
          onClose={() => setSelectedForComplete(null)}
          onCompleted={() => { refreshToday(); refreshOpen(); }}
        />
      )}

      {showOpen && (
        <OpenApptsModal
          appointments={openAppointments}
          formatDateTime={formatDateTime}
          onPick={(a) => { setSelectedForComplete(a); setShowOpen(false); }}
          onClose={() => setShowOpen(false)}
          t={t}
        />
      )}



      {/* Top intro */}
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-slate-900">
          Crown Dental Clinic — {t('dash.overview')}
        </h1>
        <p className="text-xs text-slate-500">
          {t('dash.subtitle')}
        </p>
      </div>

      {/* Grid: left column (patients + today list), right column (in_progress list + pay box) */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* ================= LEFT COLUMN ================= */}
        <div className="space-y-4">


          {/* Box 2: Today appointments (all active statuses) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  {t('dash.today_active')}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {t('dash.today_active_hint')}
                </p>
              </div>

              <button
                type="button"
                onClick={refreshToday}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600 hover:bg-slate-100"
              >
                {t('dash.refresh')}
              </button>
            </div>

            {/* Errors */}
            {todayError && (
              <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {todayError}
              </div>
            )}

            {/* Loading */}
            {isTodayLoading && !todayError && (
              <p className="text-xs text-slate-500">
                {t('dash.loading_today')}
              </p>
            )}

            {/* Empty */}
            {!isTodayLoading &&
              !todayError &&
              todayAppointments.length === 0 && (
                <p className="text-xs text-slate-500">
                  {t('dash.no_active_today')}
                </p>
              )}

            {/* Cards — compact, never scroll sideways (fits the narrow column) */}
            {todayAppointments.length > 0 && (
              <div className="mt-2 space-y-2">
                {todayAppointments.map((a) => {
                  const id = a.id ?? a.appointment_id;
                  return (
                    <div
                      key={id}
                      className="rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-[#0E6E75]/40 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{a.patient_name}</p>
                          <p className="mt-0.5 truncate text-[11px] text-slate-500">
                            {a.patient_phone} · {formatTime(a.scheduled_start)} · <span className="capitalize">{a.appointment_type}</span>
                          </p>
                        </div>
                        <span
                          className={
                            "shrink-0 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize " +
                            statusBadgeClasses(a.status)
                          }
                        >
                          {a.status?.replace("_", " ")}
                        </span>
                      </div>

                      {a.complaint && (
                        <p className="mt-2 line-clamp-2 whitespace-pre-wrap break-words text-[12px] text-slate-600">
                          {a.complaint}
                        </p>
                      )}

                      <div className="mt-2.5 flex items-center justify-end gap-1.5">
                        {a.status === "checked_in" && (
                          <button
                            type="button"
                            onClick={() => handleStart(id)}
                            disabled={startingId === id}
                            className="rounded-md border border-purple-200 bg-purple-50 px-3 py-1 text-[11px] font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50"
                          >
                            {startingId === id ? t('dash.starting') : t('dash.start')}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedAppointment(a)}
                          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-700 hover:bg-slate-100"
                        >
                          {t('common.view')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="space-y-4">
          {/* In-progress appointments – click to fill session + works */}
          <div className="rounded-3xl border border-[#0E6E75]/20 bg-[#0E6E75]/10/60 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {t('dash.in_progress_title')}
                </h2>
                <p className="text-[12px] text-slate-600">
                  {t('dash.in_progress_hint')}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {/* Unfinished visits (all dates) — catches sessions started on a past day. */}
                <button
                  type="button"
                  onClick={() => setShowOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0E6E75] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-[#013f5a]"
                >
                  {t('dash.unfinished_btn')}
                  <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-white/20 px-1.5 text-[11px] font-semibold">
                    {openAppointments.length}
                  </span>
                </button>

                <span className="rounded-full border border-[#0E6E75]/20 bg-[#0E6E75]/10 px-3 py-1 text-[11px] font-medium text-[#0E6E75]">
                  {t('dash.in_progress_count', { count: inProgressAppointments.length })}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm max-h-64 overflow-y-auto pr-1">
              {inProgressAppointments.length === 0 && (
                <p className="text-xs text-slate-600">
                  {t('dash.no_in_progress')}
                </p>
              )}

              {inProgressAppointments.map((a) => {
                const id = a.id ?? a.appointment_id;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedForComplete(a)}
                    className="flex w-full items-center justify-between rounded-2xl border border-[#0E6E75]/20 bg-white px-4 py-3 text-left transition hover:shadow-sm hover:bg-[#0E6E75]/10/60"
                  >
                    <div>
                      <p className="font-medium text-slate-800">
                        {a.patient_name}
                      </p>
                      <p className="mt-1 text-[12px] text-slate-500">
                        Dr. {a.doctor_name} · {formatTime(a.scheduled_start)} ·{" "}
                        {a.appointment_type}
                      </p>
                    </div>

                    <span className="rounded-full bg-[#0E6E75]/15 px-3 py-1 text-[11px] font-medium text-[#0E6E75] border border-[#0E6E75]/30">
                      {a.status}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          
        </div>
      </div>
    </div>
  );
}

// Popup list of ALL unfinished (in_progress) visits, any date. Each row shows the
// date + patient name; clicking one opens the same complete flow to finalize it.
function OpenApptsModal({ appointments, formatDateTime, onPick, onClose, t }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">
            {t('dash.unfinished_title')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-0.5 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3">
          {appointments.length === 0 ? (
            <p className="p-3 text-sm text-slate-500">{t('dash.unfinished_empty')}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {appointments.map((a) => {
                const id = a.id ?? a.appointment_id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onPick(a)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-left hover:border-[#0E6E75] hover:bg-[#0E6E75]/5"
                  >
                    <span className="font-medium text-slate-800">{a.patient_name}</span>
                    <span className="text-xs text-slate-500">{formatDateTime(a.scheduled_start)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


