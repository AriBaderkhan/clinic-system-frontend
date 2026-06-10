import api from './api';

export const getPlans = async () => {
    const res = await api.get('/api/plans');
    return res.data;
};

export const createPlan = async (data) => {
    const res = await api.post('/api/plans', data);
    return res.data;
};

export const updatePlan = async (id, data) => {
    const res = await api.put(`/api/plans/${id}`, data);
    return res.data;
};

export const getPlanById = async (id) => {
    const res = await api.get(`/api/plans/${id}`);
    return res.data;
};

export const deletePlan = async (id) => {
    const res = await api.delete(`/api/plans/${id}`);
    return res.data;
};