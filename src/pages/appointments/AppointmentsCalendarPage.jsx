import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppointmentsCalendar from "../../components/appointments/AppointmentsCalendar";
import CalendarAppointmentModal from "../../components/appointments/CalendarAppointmentModal";

function toDateParam(day) {
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
}

export default function AppointmentsCalendarPage() {
  const { t } = useTranslation();
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
        <h1 className="text-lg font-semibold text-slate-900">{t("appt.cal_title")}</h1>
        <p className="text-xs text-slate-500">
          {role === "doctor"
            ? t("appt.cal_subtitle_doctor")
            : t("appt.cal_subtitle_other")}
        </p>
      </div>

      <AppointmentsCalendar
        onSelectAppointment={setSelectedAppointment}
        onSelectDay={canCreate ? handleSelectDay : undefined}
      />
    </div>
  );
}
