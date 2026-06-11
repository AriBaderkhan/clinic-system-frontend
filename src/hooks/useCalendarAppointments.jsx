import { useCallback, useEffect, useState } from "react";
import { getCalendarAppointments } from "../api/appointmentApi";

export default function useCalendarAppointments(from, to) {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAppointments = useCallback(async () => {
    if (!from || !to) return;
    try {
      setIsLoading(true);
      setError("");
      const res = await getCalendarAppointments({ from, to });
      setAppointments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.userMessage || "Failed to load calendar appointments");
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return { appointments, isLoading, error, refresh: fetchAppointments };
}
