import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useActiveTodayAppointments from "../../hooks/useActiveTodayAppointments";
import useUnpaidSessions from "../../hooks/useUnPaidSessions";
import AppointmentStatusModal from "../../components/appointments/AppointmentStatusModal";
import CompleteAppointmentModal from "../../components/appointments/CompleteAppointmentModal";
import PaySessionModal from "../../components/appointments/PaySessionModal";
import AllUnpaidSessionsModal from "../../components/sessions/AllUnpaidSessionsModal";
import { useSettings } from "../../context/SettingContext";

// Status pill colors (labels come from the shared appt.st_* keys)
const STATUS_CHIP = {
  completed: "text-green-700 bg-green-50 border-green-100",
  scheduled: "text-slate-600 bg-slate-100 border-slate-200",
  checked_in: "text-amber-700 bg-amber-50 border-amber-100",
  in_progress: "text-[#0E6E75] bg-[#0E6E75]/10 border-[#0E6E75]/20",
  cancelled: "text-red-600 bg-red-50 border-red-100",
  no_show: "text-slate-500 bg-slate-100 border-slate-200",
};

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { formatTime, formatMoney } = useSettings();
  const navigate = useNavigate();

  const {
    appointments: todayAppointments,
    isLoading: isTodayLoading,
    error: todayError,
    refresh: refreshToday,
  } = useActiveTodayAppointments();

  const {
    sessions: unpaidSessions,
    total: unpaidTotal,
    isLoading: isUnpaidLoading,
    error: unpaidError,
    refresh: refreshUnpaid,
  } = useUnpaidSessions({ limit: 5 });

  const [selectedForStatusDashboard, setSelectedForStatusDashboard] = useState(null);
  const [selectedForComplete, setSelectedForComplete] = useState(null);
  const [selectedForPayment, setSelectedForPayment] = useState(null);
  const [showAllUnpaid, setShowAllUnpaid] = useState(false);

  // only in_progress appointments (for right column)
  const inProgressAppointments = todayAppointments.filter(
    (a) => a.status === "in_progress"
  );

  // Localized long date for the top line.
  let dateStr;
  try {
    dateStr = new Date().toLocaleDateString(i18n.language, {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  } catch {
    dateStr = new Date().toDateString();
  }

  const chipClass = (status) =>
    STATUS_CHIP[status] || "text-slate-600 bg-slate-100 border-slate-200";

  return (
    <div className="space-y-5">
      {/* Modals */}
      {selectedForStatusDashboard && (
        <AppointmentStatusModal
          appointment={selectedForStatusDashboard}
          onClose={() => setSelectedForStatusDashboard(null)}
          onUpdated={refreshToday}
        />
      )}

      {selectedForComplete && (
        <CompleteAppointmentModal
          appointment={selectedForComplete}
          onClose={() => setSelectedForComplete(null)}
          onCompleted={refreshToday}
        />
      )}

      {selectedForPayment && (
        <PaySessionModal
          session={selectedForPayment}
          onClose={() => setSelectedForPayment(null)}
          onPaid={refreshUnpaid}
        />
      )}

      {showAllUnpaid && (
        <AllUnpaidSessionsModal onClose={() => setShowAllUnpaid(false)} />
      )}

      {/* Date line */}
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {dateStr}
      </p>

      {/* Main grid: LEFT = quick actions + today's active · RIGHT = in-progress + unpaid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* ============ LEFT COLUMN ============ */}
        <div className="space-y-4">
          {/* Quick actions (above today's active appointments) */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("patients/add")}
              className="group flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#0E6E75]/40 hover:shadow-md"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0E6E75] text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6" />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900">{t('dash.new_patient')}</span>
                <span className="block text-xs text-slate-500">{t('dash.new_patient_hint')}</span>
              </span>
              <span className="ms-auto text-xl font-light text-slate-300">+</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("appointments/add")}
              className="group flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#0E6E75]/40 hover:shadow-md"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0E6E75] text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900">{t('dash.new_appointment')}</span>
                <span className="block text-xs text-slate-500">{t('dash.new_appointment_hint')}</span>
              </span>
              <span className="ms-auto text-xl font-light text-slate-300">+</span>
            </button>
          </div>

          {/* Today's active appointments */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">{t('dash.today_active')}</h2>
                <p className="text-[11px] text-slate-500">{t('dash.today_active_hint')}</p>
              </div>
              <button
                type="button"
                onClick={refreshToday}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600 transition hover:bg-slate-100"
              >
                {t('dash.refresh')}
              </button>
            </div>

            {todayError && (
              <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {todayError}
              </div>
            )}

            {isTodayLoading && !todayError && (
              <p className="text-xs text-slate-500">{t('dash.loading_today')}</p>
            )}

            {!isTodayLoading && !todayError && todayAppointments.length === 0 && (
              <p className="text-xs text-slate-500">{t('dash.no_active_today')}</p>
            )}

            {todayAppointments.length > 0 && (
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full text-start text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500">
                      <th className="px-3 py-2 text-start font-medium text-[#0E6E75]">{t('dash.col_patient')}</th>
                      <th className="px-3 py-2 text-start font-medium text-[#0E6E75]">{t('dash.col_phone')}</th>
                      <th className="px-3 py-2 text-start font-medium text-[#0E6E75]">{t('dash.col_doctor')}</th>
                      <th className="px-3 py-2 text-start font-medium text-[#0E6E75]">{t('dash.col_time')}</th>
                      <th className="px-3 py-2 text-start font-medium text-[#0E6E75]">{t('dash.col_type')}</th>
                      <th className="px-3 py-2 text-start font-medium text-[#0E6E75]">{t('dash.col_status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayAppointments.map((a) => {
                      const id = a.id ?? a.appointment_id;
                      return (
                        <tr key={id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <td className="px-3 py-2 text-slate-800">{a.patient_name}</td>
                          <td className="px-3 py-2 text-slate-700">{a.patient_phone}</td>
                          <td className="px-3 py-2 text-slate-700">{a.doctor_name}</td>
                          <td className="px-3 py-2 text-slate-700">{formatTime(a.scheduled_start)}</td>
                          <td className="px-3 py-2 text-slate-700">{a.appointment_type}</td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => setSelectedForStatusDashboard(a)}
                              className={`rounded-full border px-3 py-1 text-[11px] font-medium transition hover:opacity-80 ${chipClass(a.status)}`}
                            >
                              {t(`appt.st_${a.status}`, a.status)}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ============ RIGHT COLUMN ============ */}
        <div className="space-y-4">
          {/* In-progress appointments */}
          <div className="rounded-2xl border border-[#0E6E75]/20 bg-[#0E6E75]/5 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">{t('dash.in_progress_title')}</h2>
                <p className="text-[11px] text-slate-600">{t('dash.in_progress_hint')}</p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-medium text-amber-800">
                {t('dash.in_progress_count', { count: inProgressAppointments.length })}
              </span>
            </div>

            <div className="max-h-64 space-y-2.5 overflow-y-auto pr-1 text-sm">
              {inProgressAppointments.length === 0 && (
                <p className="text-xs text-slate-600">{t('dash.no_in_progress')}</p>
              )}

              {inProgressAppointments.map((a) => {
                const id = a.id ?? a.appointment_id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedForComplete(a)}
                    className="flex w-full items-center justify-between rounded-xl border border-[#0E6E75]/20 bg-white px-4 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">{a.patient_name}</p>
                      <p className="mt-1 text-[12px] text-slate-500">
                        {a.doctor_name} · {formatTime(a.scheduled_start)} · {a.appointment_type}
                      </p>
                    </div>
                    <span className="ms-2 shrink-0 rounded-full border border-[#0E6E75]/30 bg-[#0E6E75]/10 px-3 py-1 text-[11px] font-medium text-[#0E6E75]">
                      {t(`appt.st_${a.status}`, a.status)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unpaid sessions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">{t('dash.waiting_payment')}</h2>
                <p className="text-[11px] text-slate-500">{t('dash.waiting_payment_hint')}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-700">
                  {isUnpaidLoading ? t('dash.unpaid_count', { count: "…" }) : t('dash.unpaid_count', { count: unpaidTotal })}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllUnpaid(true)}
                  className="rounded-md border border-[#0E6E75]/30 bg-white px-3 py-1.5 text-[11px] font-medium text-[#0E6E75] transition hover:bg-[#0E6E75]/10"
                >
                  {t('dash.view_all')}
                </button>
                <button
                  type="button"
                  onClick={refreshUnpaid}
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-600 transition hover:bg-slate-50"
                >
                  {t('dash.refresh')}
                </button>
              </div>
            </div>

            {unpaidError && (
              <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {unpaidError}
              </div>
            )}

            {isUnpaidLoading && !unpaidError && (
              <p className="text-xs text-slate-500">{t('dash.loading_unpaid')}</p>
            )}

            {!isUnpaidLoading && !unpaidError && unpaidSessions.length === 0 && (
              <p className="text-xs text-slate-500">{t('dash.no_unpaid')}</p>
            )}

            {unpaidSessions.length > 0 && (
              <div className="mt-2 space-y-1.5 text-sm">
                {unpaidSessions.map((s) => (
                  <div
                    key={s.session_id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{s.patient.full_name}</p>
                      <p className="text-xs text-slate-500">
                        {s.doctor.full_name} · {formatTime(s.appointment.start_time)} ·{" "}
                        {t('dash.works_count', { count: s.works_summary.items_count })}
                        {" "}· <span className="font-medium text-slate-700">{formatMoney(s.totals.total, s.currency_code)}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedForPayment(s)}
                      className="ms-3 shrink-0 rounded-full bg-[#0E6E75] px-3.5 py-1 text-[10px] font-semibold text-white transition hover:bg-[#0A565C]"
                    >
                      {t('dash.pay')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
