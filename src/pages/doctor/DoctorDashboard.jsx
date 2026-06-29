import { useState } from "react";
import { useTranslation } from "react-i18next";

// import useActiveTodayAppointments from "../../hooks/useActiveTodayAppointments";
import useActiveApptsTodayPerDoctor from "../../hooks/useActiveApptsTodayPerDoctor";
import CalendarAppointmentModal from "../../components/appointments/CalendarAppointmentModal";
import CompleteAppointmentModal from "../../components/appointments/CompleteAppointmentModal";
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

  const { formatTime } = useSettings();
  const { t } = useTranslation();

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedForComplete, setSelectedForComplete] = useState(null);
 

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
          onCompleted={refreshToday}
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

            {/* Table */}
            {todayAppointments.length > 0 && (
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500">
                      <th className="px-3 py-2 font-medium text-[#015478]">
                        {t('dash.col_patient')}
                      </th>
                      <th className="px-3 py-2 font-medium text-[#015478]">
                        {t('dash.col_phone')}
                      </th>
                      <th className="px-3 py-2 font-medium text-[#015478]">
                        {t('dash.col_doctor')}
                      </th>
                      <th className="px-3 py-2 font-medium text-[#015478]">
                        {t('dash.col_time')}
                      </th>
                      <th className="px-3 py-2 font-medium text-[#015478]">
                        {t('dash.col_type')}
                      </th>
                      <th className="px-3 py-2 font-medium text-[#015478]">
                        {t('dash.col_complaint')}
                      </th>
                      <th className="px-3 py-2 font-medium text-[#015478]">
                        {t('dash.col_status')}
                      </th>
                      <th className="px-3 py-2 font-medium text-[#015478] text-end">
                        {t('dash.col_actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayAppointments.map((a) => {
                      const id = a.id ?? a.appointment_id;

                      return (
                        <tr
                          key={id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                        >
                          <td className="px-3 py-2 text-slate-800">
                            {a.patient_name}
                          </td>
                          <td className="px-3 py-2 text-slate-700">
                            {a.patient_phone}
                          </td>
                          <td className="px-3 py-2 text-slate-700">
                            {a.doctor_name}
                          </td>
                          <td className="px-3 py-2 text-slate-700">
                            {formatTime(a.scheduled_start)}
                          </td>
                          <td className="px-3 py-2 text-slate-700">
                            {a.appointment_type}
                          </td>
                          <td className="px-3 py-2 text-slate-700 max-w-[280px] align-top">
                            {a.complaint ? (
                              <span className="block whitespace-pre-wrap break-words">
                                {a.complaint}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-700">
                            <span
                              className={
                                "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium capitalize " +
                                statusBadgeClasses(a.status)
                              }
                            >
                              {a.status?.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-end">
                            <button
                              type="button"
                              onClick={() => setSelectedAppointment(a)}
                              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-700 hover:bg-slate-100"
                            >
                              {t('common.view')}
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

        {/* ================= RIGHT COLUMN ================= */}
        <div className="space-y-4">
          {/* In-progress appointments – click to fill session + works */}
          <div className="rounded-3xl border border-[#015478]/20 bg-[#015478]/10/60 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {t('dash.in_progress_title')}
                </h2>
                <p className="text-[12px] text-slate-600">
                  {t('dash.in_progress_hint')}
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-medium text-amber-800">
                {t('dash.in_progress_count', { count: inProgressAppointments.length })}
              </span>
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
                    className="flex w-full items-center justify-between rounded-2xl border border-[#015478]/20 bg-white px-4 py-3 text-left transition hover:shadow-sm hover:bg-[#015478]/10/60"
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

                    <span className="rounded-full bg-[#015478]/15 px-3 py-1 text-[11px] font-medium text-[#015478] border border-[#015478]/30">
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


