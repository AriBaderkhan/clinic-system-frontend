import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppointmentsCalendar from "../../components/appointments/AppointmentsCalendar";
import CalendarAppointmentModal from "../../components/appointments/CalendarAppointmentModal";
import useFloorFilter from "../../hooks/useFloorFilter";
import FloorFilter from "../../components/floors/FloorFilter";
import { useAuth } from "../../context/AuthContext";
import { hasTick, isOwnOnly } from "../../utils/can";

function toDateParam(day) {
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
}

export default function AppointmentsCalendarPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  // creating appointments needs the tick; "own only" users see just their own calendar
  const canCreate = hasTick(user, "create_appointment");
  const ownOnly = isOwnOnly(user, "view_appointment");

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const floor = useFloorFilter(); // starts on my floor; hidden for doctors / one floor

  const handleSelectDay = (day) => {
    navigate(`/appointments/add?date=${toDateParam(day)}`);
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{t("appt.cal_title")}</h1>
          <p className="text-xs text-slate-500">
            {ownOnly
              ? t("appt.cal_subtitle_doctor")
              : t("appt.cal_subtitle_other")}
          </p>
        </div>
        <FloorFilter floors={floor.floors} value={floor.floorId} onChange={floor.setFloorId} show={floor.show} />
      </div>

      <AppointmentsCalendar
        onSelectAppointment={setSelectedAppointment}
        onSelectDay={canCreate ? handleSelectDay : undefined}
        floorId={floor.floorId}
      />
    </div>
  );
}
