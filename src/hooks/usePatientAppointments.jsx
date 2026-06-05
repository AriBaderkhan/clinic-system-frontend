import { useEffect, useState } from "react";
import { getPatientAppointments } from "../api/patientApi";

export default function usePatientAppointments(patientId) {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(!!patientId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) return;

    let isMounted = true;

    async function fetchData() {
      try {
        setIsLoading(true);
        setError("");

        const res = await getPatientAppointments(patientId);
        const data = res.data?.data || res.data || [];

        if (isMounted) {
          setAppointments(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.userMessage);
          setAppointments([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [patientId]);

  return { appointments, isLoading, error };
}
