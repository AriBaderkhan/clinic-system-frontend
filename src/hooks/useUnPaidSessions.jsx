// src/hooks/useUnpaidSessions.js
import { useEffect, useState } from "react";
import { getUnpaidSessions } from "../api/sessionApi";

export default function useUnpaidSessions() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUnpaid = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getUnpaidSessions(); // { message, data }
      setSessions(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load unpaid sessions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnpaid();
  }, []);

  return { sessions, isLoading, error, refresh: fetchUnpaid };
}
