import { useEffect, useState } from "react";
import patientApi from "../api/patientApi";

function usePatientPayments(patientId) {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(!!patientId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) return;

    let cancelled = false;

    async function fetchData() {
      try {
        setIsLoading(true);
        setError("");

        const res = await patientApi.getPatientPayments(patientId);
        const data = res.data?.data || res.data || [];

        if (!cancelled) {
          setPayments(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.userMessage);
          setPayments([]);
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

  return { payments, isLoading, error };
}

export default usePatientPayments;
