import { useEffect, useState } from "react";
import patientApi from "../api/patientApi";

function usePatientById(patientId) {
  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(!!patientId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) return;

    let cancelled = false;

    async function fetchPatient() {
      try {
        setIsLoading(true);
        setError("");

        const res = await patientApi.getPatientById(patientId);
        const data = res.data?.patient || res.data?.data || res.data;

        if (!cancelled) {
          setPatient(data || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.userMessage);
          setPatient(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchPatient();

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  return { patient, isLoading, error };
}

export default usePatientById;
