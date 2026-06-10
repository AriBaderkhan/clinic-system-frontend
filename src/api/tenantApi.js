import api from './api';

export const getTenant = async () => {
    const res = await api.get('/api/tenants');
    return res.data;
};

export const updateTenant = async (data) => {
    const res = await api.put('/api/tenants', data);
    return res.data;
};

export const getBranches = async () => {
    const res = await api.get('/api/tenants/branches');
    return res.data;
};

export const createBranch = async (data) => {
    const res = await api.post('/api/tenants/branches', data);
    return res.data;
};

export const updateBranch = async (id, data) => {
    const res = await api.put(`/api/tenants/branches/${id}`, data);
    return res.data;
};

export const deleteBranch = async (id) => {
    const res = await api.delete(`/api/tenants/branches/${id}`);
    return res.data;
};

export const switchBranch = async (branchId) => {
    const res = await api.post(`/api/tenants/switch-branch/${branchId}`);
    return res.data;
};

export const getTenantDashboard = async () => {
    const res = await api.get('/api/tenants/dashboard');
    return res.data;
};