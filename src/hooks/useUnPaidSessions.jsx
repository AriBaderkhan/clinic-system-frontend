import { useCallback, useEffect, useState } from "react";
import { getUnpaidSessions } from "../api/sessionApi";

// floorId: "" = all floors, id = that floor, null = still loading (wait)
export default function useUnpaidSessions({ limit, floorId = "" } = {}) {
  const [sessions, setSessions] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchUnpaid = useCallback(async () => {
    if (floorId === null) return;
    try {
      setIsLoading(true);
      setError("");
      const params = {};
      if (limit) params.limit = limit;
      if (floorId) params.floor_id = floorId;
      const res = await getUnpaidSessions(params);
      setSessions(res.data || []);
      setTotal(res.total ?? (res.data || []).length);
    } catch (err) {
      setError(err.userMessage || "Could not load unpaid sessions.");
    } finally {
      setIsLoading(false);
    }
  }, [limit, floorId]);

  useEffect(() => {
    fetchUnpaid();
  }, [fetchUnpaid]);

  return { sessions, total, isLoading, error, refresh: fetchUnpaid };
}
