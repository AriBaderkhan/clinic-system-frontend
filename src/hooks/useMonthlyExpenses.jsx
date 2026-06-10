import { useCallback, useEffect, useState } from "react";
import {
  createMonthlyExpense,
  deleteMonthlyExpense,
  getAllMonthlyExpenses,
  getMonthlyExpenseById,
  updateMonthlyExpense,
} from "../api/monthlyExpensesApi";

export default function useMonthlyExpenses() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await getAllMonthlyExpenses();
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.userMessage || "Failed to load expenses");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(async (payload) => {
    setError("");
    const res = await createMonthlyExpense(payload);
    await refresh();
    return res.data;
  }, [refresh]);

  const update = useCallback(async (id, payload) => {
    setError("");
    const res = await updateMonthlyExpense(id, payload);
    await refresh();
    return res.data;
  }, [refresh]);

  const remove = useCallback(async (id) => {
    setError("");
    await deleteMonthlyExpense(id);
    await refresh();
  }, [refresh]);

  const getOne = useCallback(async (id) => {
    setError("");
    const res = await getMonthlyExpenseById(id);
    return res.data;
  }, []);

  return { items, isLoading, error, refresh, create, update, remove, getOne };
}