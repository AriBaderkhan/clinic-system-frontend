import api from "./api";

const BASE = "/api/monthly-expenses";

export const createMonthlyExpense = async (payload) => {
    const res = await api.post(BASE, payload);
    return res.data;
};

export const getAllMonthlyExpenses = async (params = {}) => {
    const res = await api.get(BASE, { params });
    return res.data;
};

export const getMonthlyExpenseById = async (expensesId) => {
    const res = await api.get(`${BASE}/${expensesId}`);
    return res.data;
};

export const updateMonthlyExpense = async (expensesId, payload) => {
    const res = await api.put(`${BASE}/${expensesId}`, payload);
    return res.data;
};

export const deleteMonthlyExpense = async (expensesId) => {
    const res = await api.delete(`${BASE}/${expensesId}`);
    return res.data;
};