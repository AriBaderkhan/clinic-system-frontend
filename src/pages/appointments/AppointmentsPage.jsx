// src/pages/appointments/AppointmentsPage.jsx
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import useAppointments from "../../hooks/useAppointments";
import AppointmentStatusModal from "../../components/appointments/AppointmentStatusModal";
import AppointmentDetailsModal from "../../components/appointments/AppointmentDetailsModal";
import appointmentApi from "../../api/appointmentApi";
import CompleteAppointmentModal from "../../components/appointments/CompleteAppointmentModal";
function AppointmentPage() {
  const navigate = useNavigate();

  // ---------- FILTER STATE ----------
  const [dayFilter, setDayFilter] = useState("");   // '', 'today', 'yesterday', 'last_week', 'last_month'
  const [typeFilter, setTypeFilter] = useState(""); // '', 'normal', 'urgent', 'walk_in'
  const [searchTerm, setSearchTerm] = useState("");

  const { appointments, isLoading, error, refresh } = useAppointments({
    day: dayFilter,
    type: typeFilter,
    search: searchTerm,
  });

  const [selectedForStatus, setSelectedForStatus] = useState(null);
  const [selectedForComplete, setSelectedForComplete] = useState(null);
  const [selectedDetailsId, setSelectedDetailsId] = useState(null);
  const [actionError, setActionError] = useState("");

  // ---------- ACTIONS ----------
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this appointment?"
    );
    if (!confirmDelete) return;

    try {
      setActionError("");
      await appointmentApi.deleteAppointment(id);
      await refresh();
    } catch (err) {
      console.error("Failed to delete appointment:", err);
      const msg =
        err?.response?.data?.message ||
        "Could not delete appointment. Please try again.";
      setActionError(msg);
    }
  };

  const handleEdit = (id) => {
    navigate(`/reception/appointments/${id}/edit`);
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredAppointments = appointments.filter((a) => {
    if (!normalizedSearch) return true; // no search → keep all

    const fields = [
      a.patient_name,
      a.patient_phone,
      a.doctor_name,
      a.appointment_type,
      a.status,
    ];

    return fields
      .filter(Boolean) // ignore null/undefined
      .some((value) =>
        value.toString().toLowerCase().includes(normalizedSearch)
      );
  });

  let x = 1
  return (
    <div className="space-y-6">
      {/* Modals */}
      {selectedForStatus && (
        <AppointmentStatusModal
          appointment={selectedForStatus}
          onClose={() => setSelectedForStatus(null)}
          onUpdated={refresh}
        />
      )}

      {selectedDetailsId && (
        <AppointmentDetailsModal
          appointmentId={selectedDetailsId}
          onClose={() => setSelectedDetailsId(null)}
        />
      )}

      {selectedForComplete && (
        <CompleteAppointmentModal
          appointment={selectedForComplete}
          onClose={() => setSelectedForComplete(null)}
          onCompleted={refresh} // or refreshAppointments based on your page
        />
      )}


      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Appointments
          </h1>
          <p className="text-xs text-slate-500">
            Manage Crown Dental Clinic appointments. View records, update
            status, and handle follow-ups.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/reception/appointments/add")}
          className="rounded-lg bg-[#1DB954] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"
        >
          + Add Appointment
        </button>
      </div>

      {/* Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        {/* Top bar: filters + refresh */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {/* Left: info + filters + search */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>
              {isLoading
                ? "Loading appointments…"
                : `Total appointments: ${filteredAppointments.length}`}
            </span>

            {/* Day filter */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-500">Day:</span>
              <select
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">All</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last_week">Last week</option>
                <option value="last_month">Last month</option>
              </select>
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-500">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">All</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="walk_in">Walk-in</option>
              </select>
            </div>

            {/* 🔍 Search */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-500">Search:</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Patient, phone, doctor..."
                className="w-48 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Right: buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refresh}
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600 hover:bg-slate-100"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                setDayFilter("");
                setTypeFilter("");
                setSearchTerm("");
              }}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </div>


        {/* Errors */}
        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        {actionError && (
          <div className="mb-3 rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-700">
            {actionError}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && filteredAppointments.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
            No appointments match these filters.
          </div>
        )}

        {/* Table */}
        {filteredAppointments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Patient Name</th>
                  <th className="px-3 py-2 font-medium">Patient Phone</th>
                  <th className="px-3 py-2 font-medium">Doctor</th>
                  <th className="px-3 py-2 font-medium">
                    Appointment Date/Time
                  </th>
                  <th className="px-3 py-2 font-medium">Appointment Type</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>

                {filteredAppointments.map((a) => {
                  const id = a.id ?? a.appointment_id;

                  return (
                    <tr
                      key={id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-3 py-2 text-slate-800">
                        {x++}
                      </td>
                      <td className="px-3 py-2 text-slate-800">
                        {a.patient_name}
                      </td>

                      <td className="px-3 py-2 text-slate-700">
                        {a.patient_phone}
                      </td>

                      <td className="px-3 py-2 text-slate-700 capitalize">
                        {a.doctor_name}
                      </td>

                      <td className="px-3 py-2 text-slate-700">
                        {a.scheduled_start
                          ? new Date(a.scheduled_start).toLocaleString()
                          : "-"}
                      </td>

                      <td className="px-3 py-2 text-slate-700">
                        {a.appointment_type}
                        {a.is_walk_in && (
                          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                            walk-in
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-2 text-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            if (a.status === "in_progress") {
                              setSelectedForComplete(a);
                            } else {
                              setSelectedForStatus(a);
                            }
                          }}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] capitalize text-slate-700 hover:bg-slate-100"
                        >
                          {a.status}
                        </button>
                      </td>

                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setSelectedDetailsId(id)}
                            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-700 hover:bg-slate-100"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(id)}
                            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-700 hover:bg-slate-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(id)}
                            className="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-[11px] text-red-600 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
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
  );
}

export default AppointmentPage;
