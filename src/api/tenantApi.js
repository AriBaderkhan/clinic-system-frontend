import api from './api';

// Mounted at /api/tenants in main.js

export const getTenant = async () => {
    const response = await api.get('/api/tenants');
    return response.data.data;
};

export const updateTenant = async (data) => {
    const response = await api.put('/api/tenants', data);
    return response.data.data;
};

export const getBranches = async () => {
    const response = await api.get('/api/tenants/branches');
    return response.data;
};

export const createBranch = async (data) => {
    const response = await api.post('/api/tenants/branches', data);
    return response.data;
};

export const updateBranch = async (id, data) => {
    const response = await api.put(`/api/tenants/branches/${id}`, data);
    return response.data.data;
};

export const deleteBranch = async (id) => {
    const response = await api.delete(`/api/tenants/branches/${id}`);
    return response.data;
};

export const switchBranch = async (branchId) => {
    const response = await api.post(`/api/tenants/switch-branch/${branchId}`);
    return response.data;
};
