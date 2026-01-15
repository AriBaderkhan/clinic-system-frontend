// src/hooks/useSessions.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGetAllSessions } from "../api/sessionApi";

export default function useSessions(filters = {}) {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const cleanFilters = useMemo(
    () => ({
      day: filters.day || undefined,
      q: filters.search || undefined, // matches backend: req.query.q
    }),
    [filters.day, filters.search]
  );
  const fetchSessions = useCallback(async () => {
    try {
      setError("");
      setIsLoading(true);
      const data = await apiGetAllSessions(cleanFilters);
      setSessions(data.sessions || []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  }, [cleanFilters]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, isLoading, error, refresh: fetchSessions };
}
