import { useEffect, useState } from "react";
import patientApi from "../api/patientApi";

function usePatientAppointments(patientId) {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(!!patientId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) return;

    let cancelled = false;

    async function fetchData() {
      try {
        setIsLoading(true);
        setError("");

        const res = await patientApi.getPatientAppointments(patientId);
        const data = res.data?.data || res.data || [];

        if (!cancelled) {
          setAppointments(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load patient appointments:", err);
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Could not load appointments for this patient."
          );
          setAppointments([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  return { appointments, isLoading, error };
}

export default usePatientAppointments;
