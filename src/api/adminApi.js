import api from './api';

export const registerTenant = async (data) => {
    const res = await api.post('/api/admin-platform/register', data);
    return res.data;
};

export const getAllTenants = async () => {
    const res = await api.get('/api/admin-platform/tenants');
    return res.data;
};