import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { createAppointment } from "../../api/appointmentApi";
import useDoctors from "../../hooks/useDoctors";
import AppointmentForm from "../../components/appointments/AppointmentForm";

export default function AddAppointment() {
  const navigate = useNavigate();
  const { doctors, isLoading, error: doctorsError } = useDoctors();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (payload) => {
    try {
      setIsSubmitting(true);
      await createAppointment(payload);
      navigate("/reception/appointments");
    } catch (err) {
      toast.error(err.userMessage || "Could not create appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Add Appointment</h1>
          <p className="text-xs text-slate-500">
            Create a new appointment for a patient and assign a doctor &amp; time.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        {isLoading ? (
          <div className="text-xs text-slate-500">Loading…</div>
        ) : (
          <AppointmentForm
            mode="add"
            doctors={doctors}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={doctorsError}
          />
        )}
      </div>
    </div>
  );
}
