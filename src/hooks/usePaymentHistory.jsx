import { useCallback, useEffect, useState } from "react";
import { fetchPaymentHistory } from "../api/historyApi";

// The branch's visit payments, one page at a time (newest first).
// `totals` / `total` come from the server and count ALL payments, not only the loaded pages.
export default function usePaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [totals, setTotals] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const fetchPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await fetchPaymentHistory(1);
      const data = res.data || {};
      setPayments(Array.isArray(data.rows) ? data.rows : []);
      setTotals(Array.isArray(data.totals) ? data.totals : []);
      setTotal(data.total || 0);
      setPage(1);
      setPages(data.pages || 1);
    } catch (err) {
      setError(err.userMessage || "Could not load payment history.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // the next page is added under the ones already shown
  const loadMore = useCallback(async () => {
    if (isLoadingMore || page >= pages) return;
    try {
      setIsLoadingMore(true);
      const res = await fetchPaymentHistory(page + 1);
      const data = res.data || {};
      setPayments((prev) => [...prev, ...(Array.isArray(data.rows) ? data.rows : [])]);
      setPage(page + 1);
      setPages(data.pages || pages);
    } catch (err) {
      setError(err.userMessage || "Could not load payment history.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, page, pages]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return { payments, totals, total, hasMore: page < pages, isLoading, isLoadingMore, error, refresh: fetchPayments, loadMore };
}
