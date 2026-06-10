import { useCallback, useEffect, useState } from "react";
import { getAllSessions } from "../api/sessionApi";

export default function useSessions(filters = {}) {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 20 });

  const filtersKey = JSON.stringify({
    day: filters.day || "",
    search: filters.search || "",
  });

  useEffect(() => {
    setPage(1);
  }, [filtersKey]);

  const pageLimit = 20;

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const params = {
        ...(filters.day ? { day: filters.day } : {}),
        ...(filters.search ? { q: filters.search } : {}),
        page,
        limit: pageLimit,
      };
      const res = await getAllSessions(params);
      setSessions(res.data ?? []);
      setPagination({
        total: res.total ?? 0,
        page,
        limit: pageLimit,
        totalPages: Math.ceil((res.total ?? 0) / pageLimit) || 1,
      });
    } catch (err) {
      setError(err.userMessage || "Failed to load sessions");
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, [filtersKey, page]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, isLoading, error, refresh: fetchSessions, page, setPage, pagination };
}