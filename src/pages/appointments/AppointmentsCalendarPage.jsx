import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppointmentsCalendar from "../../components/appointments/AppointmentsCalendar";
import CalendarAppointmentModal from "../../components/appointments/CalendarAppointmentModal";

function toDateParam(day) {
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
}

export default function AppointmentsCalendarPage() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const prefix = (role === "branch_manager" || role === "tenant_manager") ? "/branch" : "/reception";

  // doctors only view their calendar — creating appointments is for reception/branch
  const canCreate = role !== "doctor";

  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const handleSelectDay = (day) => {
    navigate(`${prefix}/appointments/add?date=${toDateParam(day)}`);
  };

  return (
    <div className="space-y-6">
      {selectedAppointment && (
        <CalendarAppointmentModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Calendar</h1>
        <p className="text-xs text-slate-500">
          {role === "doctor"
            ? "Your appointments at a glance. Click an appointment to see details and the patient's last sessions."
            : "All appointments at a glance, color-coded per doctor. Click an appointment for details, or click an empty day to add a new one."}
        </p>
      </div>

      <AppointmentsCalendar
        onSelectAppointment={setSelectedAppointment}
        onSelectDay={canCreate ? handleSelectDay : undefined}
      />
    </div>
  );
}
