import { useCallback, useEffect, useState } from "react";
import { fetchPaymentHistory } from "../api/historyApi";

export default function usePaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await fetchPaymentHistory();
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.userMessage || "Could not load payment history.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return { payments, isLoading, error, refresh: fetchPayments };
}