import { useCallback, useEffect, useState } from "react";
import { fetchSessionDetails } from "../api/historyApi";

export default function useSessionDetails(sessionId, open) {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDetails = useCallback(async () => {
    if (!sessionId || !open) return;
    try {
      setIsLoading(true);
      setError("");
      const res = await fetchSessionDetails(sessionId);
      setDetails(res.data ?? null);
    } catch (err) {
      setError(err.userMessage || "Could not load session details.");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, open]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { details, isLoading, error, refresh: fetchDetails };
}