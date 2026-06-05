import { useEffect, useState } from "react";
import { getPatientPayments } from "../api/patientApi";

export default function usePatientPayments(patientId) {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(!!patientId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) return;

    let isMounted = true;

    async function fetchData() {
      try {
        setIsLoading(true);
        setError("");

        const res = await getPatientPayments(patientId);
        const data = res.data?.data || res.data || [];

        if (isMounted) {
          setPayments(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.userMessage);
          setPayments([]);
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

  return { payments, isLoading, error };
}
