import { useCallback, useEffect, useState } from "react";
import { getPatientSessions } from "../api/patientApi";

export default function usePatientSessions(patientId, limit = null) {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(!!patientId);
  const [error, setError] = useState("");

  const fetchSessions = useCallback(async () => {
    if (!patientId) return;
    try {
      setIsLoading(true);
      setError("");
      const res = await getPatientSessions(patientId, limit ? { limit } : {});
      setSessions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.userMessage || "Could not load sessions.");
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, [patientId, limit]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, isLoading, error, refresh: fetchSessions };
}
