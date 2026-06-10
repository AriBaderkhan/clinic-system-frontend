import { useCallback, useEffect, useState } from "react";
import { apiGetAllSessions } from "../api/sessionApi";

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
      setError("");
      setIsLoading(true);

      const params = {
        ...(filters.day ? { day: filters.day } : {}),
        ...(filters.search ? { q: filters.search } : {}),
        page,
        limit: pageLimit,
      };

      const data = await apiGetAllSessions(params);
      setSessions(data.sessions || []);
      if (data.pagination) {
        setPagination(data.pagination);
      } else {
        const list = data.sessions || [];
        setPagination({ total: list.length, totalPages: 1, page: 1, limit: pageLimit });
      }
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
