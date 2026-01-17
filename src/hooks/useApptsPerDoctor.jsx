// src/hooks/useAppointments.jsx
import { useCallback, useEffect, useState } from "react";
import doctorApi from "../api/doctorApi";

function useApptsPerDoc(filters = {}) {
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

      const res = await doctorApi.getAllApptsPerDoc(cleanFilters);
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

export default useApptsPerDoc