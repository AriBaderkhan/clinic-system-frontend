import { useCallback, useEffect, useState } from "react";
import { getAllAppointments } from "../api/appointmentApi";

export default function useAppointments(filters = {}) {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 20 });

  const filtersKey = JSON.stringify({
    day: filters.day || "",
    type: filters.type || "",
    search: filters.search || "",
  });

  useEffect(() => {
    setPage(1);
  }, [filtersKey]);

  const isSearching = !!(filters.search && filters.search.trim().length > 0);
  const pageLimit = isSearching ? 25 : 20;

  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const params = {
        ...(filters.day ? { day: filters.day } : {}),
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.search ? { q: filters.search } : {}),
        page,
        limit: pageLimit,
      };

      const res = await getAllAppointments(params);
      const data = res.data;
      const list = Array.isArray(data) ? data : data.data || data.appointments || [];

      setAppointments(list);
      if (data.pagination) {
        setPagination(data.pagination);
      } else {
        setPagination({ total: list.length, totalPages: 1, page: 1, limit: 20 });
      }
    } catch (err) {
      setError(err.userMessage || "Failed to load appointments");
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, [filtersKey, page]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return {
    appointments,
    isLoading,
    error,
    refresh: fetchAppointments,
    page,
    setPage,
    pagination,
    isSearching,
  };
}
