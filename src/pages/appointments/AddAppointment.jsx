// src/pages/appointments/AddAppointment.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import appointmentApi from "../../api/appointmentApi";
import doctorsApi from "../../api/doctorApi";
import AppointmentForm from "../../components/appointments/AppointmentForm";

function AddAppointment() {
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDoctors() {
      try {
        setIsLoading(true);
        setError("");

        const res = await doctorsApi.getAllDoctors();
        const data = res.data;

        const list = Array.isArray(data)
          ? data
          : data.docs || data.data || [];

        setDoctors(list);
      } catch (err) {
        console.error("Failed to load doctors:", err);
        setError(err.userMessage || "Could not load doctors. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDoctors();
  }, []);

  const handleSubmit = async (payload) => {
    try {
      setIsSubmitting(true);
      setError("");

      await appointmentApi.createAppointment(payload);

      navigate("/reception/appointments");
    } catch (err) {
      setError(err.userMessage || "Could not create appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Add Appointment
          </h1>
          <p className="text-xs text-slate-500">
            Create a new appointment for a patient and assign a doctor &amp;
            time.
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        {isLoading ? (
          <div className="text-xs text-slate-500">Loading…</div>
        ) : (
          <AppointmentForm
            mode="add"
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

export default AddAppointment;
