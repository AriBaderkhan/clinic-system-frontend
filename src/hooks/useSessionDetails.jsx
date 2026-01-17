// src/hooks/useSessionDetails.jsx
import { useEffect, useState } from "react";
import { fetchSessionDetails } from "../api/historyApi";

function useSessionDetails(sessionId, open) {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    if (!sessionId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchSessionDetails(sessionId);
      setDetails(data);
    } catch (err) {
      setError(err.userMessage);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (open && sessionId) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sessionId]);

  return {
    details,
    isLoading,
    error,
    reload: load,
  };
}

export default useSessionDetails;
