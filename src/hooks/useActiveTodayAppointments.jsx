// src/hooks/useActiveTodayAppointments.jsx
import { useEffect, useState, useCallback } from "react";
import appointmentApi from "../api/appointmentApi";

function useActiveTodayAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const res = await appointmentApi.getActiveTodayAppointments();
      const data = res.data;

      const list = Array.isArray(data)
        ? data
        : data.appointments || data.data || [];

      setAppointments(list);
    } catch (err) {
      setError(err.userMessage);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return {
    appointments,
    isLoading,
    error,
    refresh: fetchAppointments,
  };
}

export default useActiveTodayAppointments;
