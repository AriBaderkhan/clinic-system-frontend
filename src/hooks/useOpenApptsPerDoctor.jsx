import { useEffect, useState, useCallback } from "react";
import { getOpenApptsPerDoc } from "../api/doctorApi";

// The doctor's unfinished (in_progress) appointments across ALL dates — powers
// the dashboard "unfinished visits" button so a forgotten past visit can still
// be finalized.
export default function useOpenApptsPerDoctor() {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await getOpenApptsPerDoc();
      setAppointments(Array.isArray(res.data) ? res.data : []);
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

  return { appointments, isLoading, error, refresh: fetchAppointments };
}
