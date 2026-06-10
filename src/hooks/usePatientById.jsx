import { useCallback, useEffect, useState } from "react";
import { getPatientById } from "../api/patientApi";

export default function usePatientById(patientId) {
  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(!!patientId);
  const [error, setError] = useState("");

  const fetchPatient = useCallback(async () => {
    if (!patientId) return;
    try {
      setIsLoading(true);
      setError("");
      const res = await getPatientById(patientId);
      setPatient(res.data ?? null);
    } catch (err) {
      setError(err.userMessage || "Could not load patient.");
      setPatient(null);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  return { patient, isLoading, error };
}