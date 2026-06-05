import { useEffect, useState } from "react";
import { fetchSessionDetails } from "../api/historyApi";

export default function useSessionDetails(sessionId, open) {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (!sessionId) return;
    try {
      setIsLoading(true);
      setError("");
      const data = await fetchSessionDetails(sessionId);
      setDetails(data);
    } catch (err) {
      setError(err.userMessage);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (open && sessionId) load();
  }, [open, sessionId]);

  return { details, isLoading, error, refresh: load };
}
