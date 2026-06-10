import { useCallback, useEffect, useState } from "react";
import { getPatientPayments } from "../api/patientApi";

export default function usePatientPayments(patientId) {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(!!patientId);
  const [error, setError] = useState("");

  const fetchPayments = useCallback(async () => {
    if (!patientId) return;
    try {
      setIsLoading(true);
      setError("");
      const res = await getPatientPayments(patientId);
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.userMessage || "Could not load payments.");
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return { payments, isLoading, error };
}