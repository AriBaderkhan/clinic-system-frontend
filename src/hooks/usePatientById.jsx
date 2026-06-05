import { useEffect, useState } from "react";
import { getPatientById } from "../api/patientApi";

export default function usePatientById(patientId) {
  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(!!patientId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) return;

    let isMounted = true;

    async function fetchPatient() {
      try {
        setIsLoading(true);
        setError("");

        const res = await getPatientById(patientId);
        const data = res.data?.patient || res.data?.data || res.data;

        if (isMounted) {
          setPatient(data || null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.userMessage);
          setPatient(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchPatient();

    return () => {
      isMounted = false;
    };
  }, [patientId]);

  return { patient, isLoading, error };
}
