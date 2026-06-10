import { useCallback, useEffect, useState } from "react";
import { getPatientAppointments } from "../api/patientApi";

export default function usePatientAppointments(patientId) {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(!!patientId);
  const [error, setError] = useState("");

  const fetchAppointments = useCallback(async () => {
    if (!patientId) return;
    try {
      setIsLoading(true);
      setError("");
      const res = await getPatientAppointments(patientId);
      setAppointments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.userMessage || "Could not load appointments.");
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return { appointments, isLoading, error };
}