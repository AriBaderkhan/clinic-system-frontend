import { useEffect, useState } from "react";
import { getSessionByAppointmentId } from "../api/appointmentApi";

export default function useAppointmentSession(appointmentId, open) {
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (!appointmentId) return;

    try {
      setIsLoading(true);
      setError("");
      setSessionId(null);

      const res = await getSessionByAppointmentId(appointmentId);
      const sid = res?.data?.data?.session_id;
      setSessionId(sid || null);
    } catch (err) {
      if (err?.response?.status === 404) {
        setSessionId(null);
        setError("");
        return;
      }
      setError(err.userMessage);
      setSessionId(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (open && appointmentId) load();
  }, [open, appointmentId]);

  return { sessionId, isLoading, error, refresh: load };
}
