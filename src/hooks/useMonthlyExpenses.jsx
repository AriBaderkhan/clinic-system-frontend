// src/hooks/useMonthlyExpenses.js
import { useCallback, useEffect, useMemo, useState } from "react";
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
    setIsLoading(true);
    setError("");
    try {
      const res = await getAllMonthlyExpenses();

      // backend returns { data: result }
      const list = Array.isArray(res) ? res : (res?.data || res?.rows || []);

      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.userMessage);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const actions = useMemo(
    () => ({
      async create(payload) {
        setError("");
        const res = await createMonthlyExpense(payload);
        await refresh();
        return res?.data ?? res;
      },

      async update(id, payload) {
        setError("");
        const res = await updateMonthlyExpense(id, payload);
        await refresh();
        return res?.data ?? res;
      },

      async remove(id) {
        setError("");
        await deleteMonthlyExpense(id);
        await refresh();
      },

      async getOne(id) {
        setError("");
        const res = await getMonthlyExpenseById(id);
        return res?.data ?? res; // unwrap { data: result }
      },
    }),
    [refresh]
  );

  return { items, isLoading, error, refresh, ...actions };
}
