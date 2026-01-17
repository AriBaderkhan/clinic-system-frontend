import { useEffect, useState } from "react";
import patientApi from "../api/patientApi";

function usePatientSessions(patientId) {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(!!patientId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) return;

    let cancelled = false;

    async function fetchData() {
      try {
        setIsLoading(true);
        setError("");

        const res = await patientApi.getPatientSessions(patientId);
        const data = res.data?.data || res.data || [];

        if (!cancelled) {
          setSessions(Array.isArray(data) ? data : []);
        }
      } catch (err) {

        if (!cancelled) {
          setError(err.userMessage);
          setSessions([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  return { sessions, isLoading, error };
}

export default usePatientSessions;
