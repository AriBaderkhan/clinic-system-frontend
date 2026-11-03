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
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/common/PageHeader";

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
  const { user } = useAuth();

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
    <div className="w-full space-y-5">
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
      <PageHeader
        title={<>{user?.clinic_name ? `${user.clinic_name} — ` : ""}{t('dash.overview')}</>}
        subtitle={t('dash.subtitle')}
      />

      {/* Grid: left column (patients + today list), right column (in_progress list + pay box) */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        {/* ================= LEFT COLUMN ================= */}
        <div className="col-fill">


          {/* Box 2: Today appointments (all active statuses) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-slate-900">
                  {t('dash.today_active')}
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {t('dash.today_active_hint')}
                </p>
              </div>

              <button
                type="button"
                onClick={refreshToday}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {t('dash.refresh')}
              </button>
            </div>

            {/* Errors */}
            {todayError && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {todayError}
              </div>
            )}

            {/* Loading */}
            {isTodayLoading && !todayError && (
              <p className="py-10 text-center text-sm text-slate-500">
                {t('dash.loading_today')}
              </p>
            )}

            {/* Empty */}
            {!isTodayLoading &&
              !todayError &&
              todayAppointments.length === 0 && (
                <p className="py-10 text-center text-sm text-slate-500">
                  {t('dash.no_active_today')}
                </p>
              )}

            {/* Cards — compact, never scroll sideways (fits the narrow column) */}
            {todayAppointments.length > 0 && (
              <div className="space-y-2.5">
                {todayAppointments.map((a) => {
                  const id = a.id ?? a.appointment_id;
                  return (
                    <div
                      key={id}
                      className="rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-brand/40 hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{a.patient_name}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {a.patient_phone} · {formatTime(a.scheduled_start)} · <span className="capitalize">{a.appointment_type}</span>
                          </p>
                        </div>
                        <span
                          className={
                            "shrink-0 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize " +
                            statusBadgeClasses(a.status)
                          }
                        >
                          {a.status?.replace("_", " ")}
                        </span>
                      </div>

                      {a.complaint && (
                        <p className="mt-2 line-clamp-2 whitespace-pre-wrap break-words text-sm text-slate-600">
                          {a.complaint}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                        {a.status === "checked_in" && (
                          <button
                            type="button"
                            onClick={() => handleStart(id)}
                            disabled={startingId === id}
                            className="inline-flex items-center rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
                          >
                            {startingId === id ? t('dash.starting') : t('dash.start')}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedAppointment(a)}
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
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
        <div className="col-fill">
          {/* In-progress appointments – click to fill session + works */}
          <div className="rounded-2xl border border-brand/30 bg-white p-4 shadow-card sm:p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-slate-900">
                  {t('dash.in_progress_title')}
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {t('dash.in_progress_hint')}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Unfinished visits (all dates) — catches sessions started on a past day. */}
                <button
                  type="button"
                  onClick={() => setShowOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
                >
                  {t('dash.unfinished_btn')}
                  <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-white/20 px-1.5 text-xs font-semibold">
                    {openAppointments.length}
                  </span>
                </button>

                <span className="inline-flex items-center rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
                  {t('dash.in_progress_count', { count: inProgressAppointments.length })}
                </span>
              </div>
            </div>

            <div className="max-h-80 space-y-2.5 overflow-y-auto pe-1 text-sm">
              {inProgressAppointments.length === 0 && (
                <p className="py-10 text-center text-sm text-slate-500">
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
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-start transition hover:border-brand/40 hover:bg-brand/10"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {a.patient_name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        Dr. {a.doctor_name} · {formatTime(a.scheduled_start)} ·{" "}
                        {a.appointment_type}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">
            {t('dash.unfinished_title')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          {appointments.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">{t('dash.unfinished_empty')}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {appointments.map((a) => {
                const id = a.id ?? a.appointment_id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onPick(a)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-start transition hover:border-brand hover:bg-brand/5"
                  >
                    <span className="min-w-0 truncate font-medium text-slate-900">{a.patient_name}</span>
                    <span className="shrink-0 text-xs text-slate-500">{formatDateTime(a.scheduled_start)}</span>
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


