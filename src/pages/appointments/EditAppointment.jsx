import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import appointmentApi from "../../api/appointmentApi";
import doctorsApi from "../../api/doctorApi"; // your small wrapper around /api/doctors
import AppointmentForm from "../../components/appointments/AppointmentForm";

function EditAppointment() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // load doctors + appointment
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError("");

        const [apptRes, docsRes] = await Promise.all([
          appointmentApi.getAppointmentById(appointmentId),
          doctorsApi.getAllDoctors(),
        ]);

        const apptData = apptRes.data?.appointment || apptRes.data;
        console.log("EDIT APPOINTMENT DATA >>>", apptData);  
        setAppointment(apptData);

        const docsList = docsRes.data?.docs || docsRes.data || [];
        setDoctors(docsList);
      } catch (err) {
        console.error("Failed to load appointment for edit:", err);
        const msg =
          err?.response?.data?.message ||
          "Could not load appointment. Please try again.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [appointmentId]);

  // submit handler for form
  const handleSubmit = async (formValues) => {
    // from AppointmentForm we expect: { doctor_id, scheduled_start }
    try {
      setIsSubmitting(true);
      setError("");

      await appointmentApi.editAppointment(appointmentId, {
        doctor_id: formValues.doctor_id,
        scheduled_start: formValues.scheduled_start,
      });

      navigate("/dashboard/appointments");
    } catch (err) {
      console.error("Failed to update appointment:", err);
      const msg =
        err?.response?.data?.message ||
        "Could not update appointment. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Edit Appointment
          </h1>
          <p className="text-xs text-slate-500">
            Only doctor and date/time can be changed. Status & type are fixed.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        {isLoading && (
          <p className="text-xs text-slate-500">Loading appointment…</p>
        )}

        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        {!isLoading && !appointment && !error && (
          <p className="text-xs text-slate-500">
            Appointment not found or cannot be edited.
          </p>
        )}

        {!isLoading && appointment && (
          <AppointmentForm
            mode="edit"
            initialData={appointment}
            doctors={doctors}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={error}
          />
        )}
      </div>
    </div>
  );
}

export default EditAppointment;
