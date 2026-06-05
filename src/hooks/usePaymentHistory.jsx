import { useEffect, useState } from "react";
import { fetchPaymentHistory } from "../api/historyApi";

export default function usePaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setIsLoading(true);
      setError("");
      const data = await fetchPaymentHistory();
      setPayments(data);
    } catch (err) {
      setError(err.userMessage);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return { payments, isLoading, error, refresh: load };
}
