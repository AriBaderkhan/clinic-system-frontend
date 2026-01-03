// src/hooks/useAppointments.jsx
import { useCallback, useEffect, useState } from "react";
import appointmentApi from "../api/appointmentApi";

function useAppointments(filters = {}) {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const cleanFilters = {
    day: filters.day || undefined,
    type: filters.type || undefined,
    q: filters.search || undefined, // 🔍 match controller: req.query.q
  };

  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const res = await appointmentApi.getAllAppointments(cleanFilters);
      const data = res.data;

      const list = Array.isArray(data)
        ? data
        : data.appointments || data.data || [];

      setAppointments(list);
    } catch (err) {
      console.error("Failed to load appointments:", err);
      const msg =
        err?.response?.data?.message ||
        "Could not load appointments. Please try again.";
      setError(msg);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(cleanFilters)]);

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

export default useAppointments