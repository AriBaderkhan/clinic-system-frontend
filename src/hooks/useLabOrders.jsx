import { useCallback, useEffect, useState } from "react";
import { getAllLabOrders } from "../api/labApi";

export default function useLabOrders(filters = {}) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 20 });

  const filtersKey = JSON.stringify({
    status: filters.status || "",
    search: filters.search || "",
  });

  useEffect(() => {
    setPage(1);
  }, [filtersKey]);

  const pageLimit = 20;

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const params = {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.search ? { q: filters.search } : {}),
        page,
        limit: pageLimit,
      };

      const res = await getAllLabOrders(params);
      setOrders(res.data ?? []);
      setPagination({
        total: res.total ?? 0,
        page,
        limit: pageLimit,
        totalPages: Math.ceil((res.total ?? 0) / pageLimit) || 1,
      });
    } catch (err) {
      setError(err.userMessage || "Failed to load lab orders");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [filtersKey, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, isLoading, error, refresh: fetchOrders, page, setPage, pagination };
}
