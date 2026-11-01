import { useCallback, useEffect, useState } from "react";
import { getCalendarAppointments } from "../api/appointmentApi";

// floorId: "" = all floors, null = floor filter still loading (wait)
export default function useCalendarAppointments(from, to, floorId = "") {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAppointments = useCallback(async () => {
    if (!from || !to || floorId === null) return;
    try {
      setIsLoading(true);
      setError("");
      const res = await getCalendarAppointments({ from, to, ...(floorId ? { floor_id: floorId } : {}) });
      setAppointments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.userMessage || "Failed to load calendar appointments");
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, [from, to, floorId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return { appointments, isLoading, error, refresh: fetchAppointments };
}
