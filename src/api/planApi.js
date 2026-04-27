import api from './api';

export const getPlans = async () => {
    const response = await api.get('/api/plans');
    return response.data.data;
};

export const createPlan = async (data) => {
    const response = await api.post('/api/plans', data);
    return response.data.data;
};

export const updatePlan = async (id, data) => {
    const response = await api.put(`/api/plans/${id}`, data);
    return response.data.data;
};

export const getPlanById = async (id) => {
    const response = await api.get(`/api/plans/${id}`);
    return response.data.data;
};

export const deletePlan = async (id) => {
    const response = await api.delete(`/api/plans/${id}`);
    return response.data.data;
};
