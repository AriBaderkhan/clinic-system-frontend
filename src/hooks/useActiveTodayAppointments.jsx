import { useEffect, useState, useCallback } from "react";
import { getActiveTodayAppointments } from "../api/appointmentApi";

// floorId: "" = all floors, null = floor filter still loading (wait)
export default function useActiveTodayAppointments(floorId = "") {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAppointments = useCallback(async () => {
    if (floorId === null) return;
    try {
      setIsLoading(true);
      setError("");
      const res = await getActiveTodayAppointments(floorId ? { floor_id: floorId } : {});
      setAppointments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.userMessage);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, [floorId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return { appointments, isLoading, error, refresh: fetchAppointments };
}