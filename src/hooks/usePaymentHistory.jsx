// src/hooks/usePaymentHistory.jsx
import { useEffect, useState } from "react";
import { fetchPaymentHistory } from "../api/historyApi";

function usePaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setIsLoading(true);
      setError(null);

      const data = await fetchPaymentHistory();
      setPayments(data);
    } catch (err) {
      console.error("usePaymentHistory error:", err);
      setError(
        err.response?.data?.message ||
          "Could not load payment history. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return {
    payments,
    isLoading,
    error,
    refresh: load,
  };
}

export default usePaymentHistory;
