import { useEffect, useState } from "react";
import { getUnpaidSessions } from "../api/sessionApi";

export default function useUnpaidSessions() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchUnpaid = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await getUnpaidSessions();
      setSessions(res.data || []);
    } catch (err) {
      setError(err.userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnpaid();
  }, []);

  return { sessions, isLoading, error, refresh: fetchUnpaid };
}
