import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getAppointmentById, editAppointment } from "../../api/appointmentApi";
import useDoctors from "../../hooks/useDoctors";
import AppointmentForm from "../../components/appointments/AppointmentForm";

export default function EditAppointment() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const { doctors } = useDoctors();
  const [appointment, setAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadAppointment() {
      try {
        setIsLoading(true);
        setLoadError("");
        const res = await getAppointmentById(appointmentId);
        setAppointment(res.data?.appointment || res.data);
      } catch (err) {
        setLoadError(err.userMessage || "Could not load appointment data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    loadAppointment();
  }, [appointmentId]);

  const handleSubmit = async (formValues) => {
    try {
      setIsSubmitting(true);
      await editAppointment(appointmentId, {
        patient_id: formValues.patient_id,
        doctor_id: formValues.doctor_id,
        scheduled_start: formValues.scheduled_start,
      });
      navigate("/reception/appointments");
    } catch (err) {
      toast.error(err.userMessage || "Could not update appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Edit Appointment</h1>
          <p className="text-xs text-slate-500">
            Only doctor and date/time can be changed. Status & type are fixed.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        {isLoading && <p className="text-xs text-slate-500">Loading appointment…</p>}

        {loadError && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {loadError}
          </div>
        )}

        {!isLoading && !appointment && !loadError && (
          <p className="text-xs text-slate-500">Appointment not found or cannot be edited.</p>
        )}

        {!isLoading && appointment && (
          <AppointmentForm
            mode="edit"
            initialData={appointment}
            doctors={doctors}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
