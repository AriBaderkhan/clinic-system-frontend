// src/hooks/useAppointmentSession.js
import { useEffect, useState } from "react";
import appointmentApi from "../api/appointmentApi";

function useAppointmentSession(appointmentId, open) {
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (!appointmentId) return;

    try {
      setIsLoading(true);
      setError("");
      setSessionId(null);

      const res = await appointmentApi.getSessionByAppointmentId(appointmentId);
      // backend: { message, data: { session_id } }
      const sid = res?.data?.data?.session_id;

      setSessionId(sid || null);
    } catch (err) {
      // If 404 => no session yet. That's NOT an error for UI.
      if (err?.response?.status === 404) {
        setSessionId(null);
        setError("");
        return;
      }

      setError(
        err?.response?.data?.message ||
          "Could not load session for this appointment."
      );
      setSessionId(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (open && appointmentId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appointmentId]);

  return { sessionId, isLoading, error, reload: load };
}

export default useAppointmentSession;