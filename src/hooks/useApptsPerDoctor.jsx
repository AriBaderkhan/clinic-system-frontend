import { useCallback, useEffect, useState } from "react";
import { getAllApptsPerDoc } from "../api/doctorApi";

export default function useApptsPerDoc(filters = {}) {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const cleanFilters = {
    day: filters.day || undefined,
    type: filters.type || undefined,
    q: filters.search || undefined,
  };

  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await getAllApptsPerDoc(cleanFilters);
      setAppointments(Array.isArray(res.data) ? res.data : []);
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

  return { appointments, isLoading, error, refresh: fetchAppointments };
}