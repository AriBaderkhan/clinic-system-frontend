import api from './api';

// Mounted at /api/branches in main.js

export const getBranch = async (id) => {
    const response = await api.get(`/api/branches/${id}`);
    return response.data;
};

export const updateBranch = async (id, data) => {
    const response = await api.put(`/api/branches/${id}`, data);
    return response.data;
};
