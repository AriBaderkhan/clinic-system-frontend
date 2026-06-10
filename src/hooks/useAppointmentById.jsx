import { useCallback, useEffect, useState } from "react";
import { getAppointmentById } from "../api/appointmentApi";

export default function useAppointmentById(appointmentId) {
  const [appointment, setAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(appointmentId));
  const [error, setError] = useState("");

  const fetchAppointment = useCallback(async () => {
    if (!appointmentId) return;
    try {
      setIsLoading(true);
      setError("");
      const res = await getAppointmentById(appointmentId);
      setAppointment(res.data ?? null);
    } catch (err) {
      setError(err.userMessage || "Could not load appointment.");
      setAppointment(null);
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  return { appointment, isLoading, error };
}