import { useCallback, useEffect, useState } from "react";
import { getAllLabs } from "../api/labApi";

export default function useLabs(filters = {}) {
  const [labs, setLabs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 20 });

  const filtersKey = JSON.stringify({ search: filters.search || "" });

  useEffect(() => {
    setPage(1);
  }, [filtersKey]);

  const pageLimit = 20;

  const fetchLabs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const params = {
        ...(filters.search ? { q: filters.search } : {}),
        page,
        limit: pageLimit,
      };

      const res = await getAllLabs(params);
      setLabs(res.data ?? []);
      setPagination({
        total: res.total ?? 0,
        page,
        limit: pageLimit,
        totalPages: Math.ceil((res.total ?? 0) / pageLimit) || 1,
      });
    } catch (err) {
      setError(err.userMessage || "Failed to load labs");
      setLabs([]);
    } finally {
      setIsLoading(false);
    }
  }, [filtersKey, page]);

  useEffect(() => {
    fetchLabs();
  }, [fetchLabs]);

  return { labs, isLoading, error, refresh: fetchLabs, page, setPage, pagination };
}
