import { useEffect, useState } from "react";
import { getPatientSessions } from "../api/patientApi";

export default function usePatientSessions(patientId) {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(!!patientId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) return;

    let isMounted = true;

    async function fetchData() {
      try {
        setIsLoading(true);
        setError("");

        const res = await getPatientSessions(patientId);
        const data = res.data?.data || res.data || [];

        if (isMounted) {
          setSessions(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.userMessage);
          setSessions([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [patientId]);

  return { sessions, isLoading, error };
}
