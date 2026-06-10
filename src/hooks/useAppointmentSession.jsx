import { useCallback, useEffect, useState } from "react";
import { getSessionByAppointmentId } from "../api/appointmentApi";

export default function useAppointmentSession(appointmentId, open) {
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSession = useCallback(async () => {
    if (!appointmentId || !open) return;
    try {
      setIsLoading(true);
      setError("");
      setSessionId(null);
      const res = await getSessionByAppointmentId(appointmentId);
      setSessionId(res?.data?.session_id ?? null);
    } catch (err) {
      if (err?.response?.status === 404) {
        setSessionId(null);
        setError("");
        return;
      }
      setError(err.userMessage || "Could not load session.");
      setSessionId(null);
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId, open]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return { sessionId, isLoading, error, refresh: fetchSession };
}