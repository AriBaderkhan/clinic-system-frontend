import { useEffect, useState } from "react";
import { getAppointmentById } from "../api/appointmentApi";

export default function useAppointmentById(appointmentId) {
  const [appointment, setAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(appointmentId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!appointmentId) return;

    let isMounted = true;

    async function fetchAppointment() {
      try {
        setIsLoading(true);
        setError("");

        const res = await getAppointmentById(appointmentId);
        const data = res.data;
        const appt = data?.appointment || data?.data || data;

        if (isMounted) {
          setAppointment(appt);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.userMessage);
          setAppointment(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchAppointment();

    return () => {
      isMounted = false;
    };
  }, [appointmentId]);

  return { appointment, isLoading, error };
}
