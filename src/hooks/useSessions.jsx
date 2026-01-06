// src/hooks/useSessions.js
import { useCallback, useEffect, useState } from "react";
import { apiGetAllSessions } from "../api/sessionApi";

export default function useSessions() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSessions = useCallback(async () => {
    try {
      setError("");
      setIsLoading(true);
      const data = await apiGetAllSessions();
      setSessions(data.sessions || []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, isLoading, error, refresh: fetchSessions };
}
