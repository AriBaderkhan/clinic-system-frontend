import { useEffect, useState } from "react";
import appointmentApi from "../api/appointmentApi";

function useAppointmentById(appointmentId) {
  const [appointment, setAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(appointmentId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!appointmentId) return;

    let cancelled = false;

    async function fetchAppointment() {
      try {
        setIsLoading(true);
        setError("");

        const res = await appointmentApi.getAppointmentById(appointmentId);
        // backend: { message, appointment }
        const data = res.data;
        const appt = data?.appointment || data?.data || data;

        if (!cancelled) {
          setAppointment(appt);
        }
      } catch (err) {
        console.error("Failed to load appointment by id:", err);
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              "Could not load appointment. Please try again."
          );
          setAppointment(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchAppointment();

    return () => {
      cancelled = true;
    };
  }, [appointmentId]);

  return { appointment, isLoading, error };
}

export default useAppointmentById;
