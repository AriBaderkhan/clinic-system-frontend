import { useState } from "react";
import usePatients from "../../hooks/usePatients";
import useActiveTodayAppointments from "../../hooks/useActiveTodayAppointments";
import useUnpaidSessions from "../../hooks/useUnPaidSessions";
import AppointmentStatusModal from "../../components/appointments/AppointmentStatusModal";
import CompleteAppointmentModal from "../../components/appointments/CompleteAppointmentModal";
import PaySessionModal from "../../components/appointments/PaySessionModal";
import AllUnpaidSessionsModal from "../../components/sessions/AllUnpaidSessionsModal";
import { useSettings } from "../../context/SettingContext";

export default function Dashboard() {
  const { formatTime, formatMoney } = useSettings();
  const { patients, isLoading } = usePatients();

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

  const [selectedForStatusDashboard, setSelectedForStatusDashboard] =
    useState(null);
  const [selectedForComplete, setSelectedForComplete] = useState(null);
  const [selectedForPayment, setSelectedForPayment] = useState(null);
  const [showAllUnpaid, setShowAllUnpaid] = useState(false);

  // only in_progress appointments (for right column)
  const inProgressAppointments = todayAppointments.filter(
    (a) => a.status === "in_progress"
  );

  return (
    <div className="space-y-6">
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

      {/* Top intro */}
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-slate-900">
          Crown Dental Clinic — Overview
        </h1>
        <p className="text-xs text-slate-500">
          Quick snapshot of today&apos;s patients, appointments, and active
          cases.
        </p>
      </div>

      {/* Grid: left column (patients + today list), right column (in_progress list + pay box) */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* ================= LEFT COLUMN ================= */}
        <div className="space-y-4">
          {/* Box 1: Total patients */}
          {/* <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Total Patients
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {isLoading ? "Loading patients…" : patients.length}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#015478]/10 text-[#015478]">
                👥
              </div>
            </div>
          </div> */}

          {/* for now total patient is disabled*/}

          {/* Box 2: Today appointments (all active statuses) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Today&apos;s active appointments
                </h2>
                <p className="text-[11px] text-slate-500">
                  Showing only <strong>scheduled</strong>,{" "}
                  <strong>checked-in</strong> and <strong>in progress</strong>{" "}
                  appointments for today.
                </p>
              </div>

              <button
                type="button"
                onClick={refreshToday}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600 hover:bg-slate-100"
              >
                Refresh
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
                Loading today&apos;s appointments…
              </p>
            )}

            {/* Empty */}
            {!isTodayLoading &&
              !todayError &&
              todayAppointments.length === 0 && (
                <p className="text-xs text-slate-500">
                  No active appointments for today.
                </p>
              )}

            {/* Table */}
            {todayAppointments.length > 0 && (
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500">
                      <th className="px-3 py-2 font-medium text-[#015478]">
                        Patient
                      </th>
                      <th className="px-3 py-2 font-medium text-[#015478]">
                        Phone
                      </th>
                      <th className="px-3 py-2 font-medium text-[#015478]">
                        Doctor
                      </th>
                      <th className="px-3 py-2 font-medium text-[#015478]">
                        Time
                      </th>
                      <th className="px-3 py-2 font-medium text-[#015478]">
                        Type
                      </th>
                      <th className="px-3 py-2 font-medium text-[#015478]">
                        Status
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
                          <td className="px-3 py-2 text-slate-700">
                            <button
                              type="button"
                              onClick={() => setSelectedForStatusDashboard(a)}
                              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] capitalize text-slate-700 hover:bg-slate-100"
                            >
                              {a.status}
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
                  In-progress appointments (Today)
                </h2>
                <p className="text-[12px] text-slate-600">
                  Click an appointment to update status, fill session and works.
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-medium text-amber-800">
                {inProgressAppointments.length} in progress
              </span>
            </div>

            <div className="space-y-3 text-sm max-h-64 overflow-y-auto pr-1">
              {inProgressAppointments.length === 0 && (
                <p className="text-xs text-slate-600">
                  No in-progress appointments right now.
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
                        {a.doctor_name} · {formatTime(a.scheduled_start)} ·{" "}
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

          {/* Unpaid sessions pay box */}
          <div className="rounded-3xl border border-[#015478]/15 bg-[#015478]/5 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Sessions waiting for payment
                </h2>
                <p className="text-[11px] text-[#015478]/60">
                  Newly completed sessions that reception needs to charge.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-700 border border-amber-200">
                  {isUnpaidLoading ? "…" : unpaidTotal} unpaid
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllUnpaid(true)}
                  className="rounded-md border border-[#015478]/30 bg-white px-3 py-1.5 text-[11px] font-medium text-[#015478] hover:bg-[#015478]/10"
                >
                  View all
                </button>
                <button
                  type="button"
                  onClick={refreshUnpaid}
                  className="rounded-md border border-[#015478]/20 bg-white px-3 py-1.5 text-[11px] text-slate-600 hover:bg-[#015478]/10"
                >
                  Refresh
                </button>
              </div>
            </div>

            {unpaidError && (
              <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {unpaidError}
              </div>
            )}

            {isUnpaidLoading && !unpaidError && (
              <p className="text-xs text-[#015478]/60">Loading unpaid sessions…</p>
            )}

            {!isUnpaidLoading &&
              !unpaidError &&
              unpaidSessions.length === 0 && (
                <p className="text-xs text-[#015478]/60">
                  No unpaid sessions right now.
                </p>
              )}

            {unpaidSessions.length > 0 && (
              <div className="mt-2 space-y-1.5 text-sm">
                {unpaidSessions.map((s) => (
                  <div
                    key={s.session_id}
                    className="flex items-center justify-between rounded-xl border border-[#015478]/10 bg-white px-3.5 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {s.patient.full_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {s.doctor.full_name} · {formatTime(s.appointment.start_time)} ·{" "}
                        {s.works_summary.items_count} work{s.works_summary.items_count !== 1 && "s"}
                        {" "}· <span className="font-medium text-slate-700">{formatMoney(s.totals.total)}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedForPayment(s)}
                      className="ml-3 flex-shrink-0 rounded-full bg-[#015478] px-3.5 py-1 text-[10px] font-semibold text-white hover:bg-[#013d58]"
                    >
                      Pay
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

