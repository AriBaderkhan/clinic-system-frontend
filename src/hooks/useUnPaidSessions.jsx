import { useCallback, useEffect, useState } from "react";
import { getUnpaidSessions } from "../api/sessionApi";

export default function useUnpaidSessions({ limit } = {}) {
  const [sessions, setSessions] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchUnpaid = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const params = {};
      if (limit) params.limit = limit;
      const res = await getUnpaidSessions(params);
      setSessions(res.data || []);
      setTotal(res.total ?? (res.data || []).length);
    } catch (err) {
      setError(err.userMessage || "Could not load unpaid sessions.");
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchUnpaid();
  }, [fetchUnpaid]);

  return { sessions, total, isLoading, error, refresh: fetchUnpaid };
}