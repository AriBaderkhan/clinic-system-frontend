// src/api/monthlyExpensesApi.js
import api from "./api";

const BASE = "/api/monthly-expenses";

export async function createMonthlyExpense(payload) {
  const { data } = await api.post(BASE, payload);
  return data;
}

export async function getAllMonthlyExpenses(params = {}) {
  // optional later: ?year=2025 or ?from=...&to=...
  const { data } = await api.get(BASE, { params });
  return data;
}

export async function getMonthlyExpenseById(expensesId) {
  const { data } = await api.get(`${BASE}/${expensesId}`);
  return data;
}

export async function updateMonthlyExpense(expensesId, payload) {
  const { data } = await api.put(`${BASE}/${expensesId}`, payload);
  return data;
}

export async function deleteMonthlyExpense(expensesId) {
  const { data } = await api.delete(`${BASE}/${expensesId}`);
  return data;
}
