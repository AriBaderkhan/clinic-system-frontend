import api from './api';

export const registerTenant = async (data) => {
    // POST /api/admin-platform/register
    const response = await api.post('/api/admin-platform/register', data);
    return response.data;
};

export const getAllTenants = async () => {
    // GET /api/admin-platform/tenants
    const response = await api.get('/api/admin-platform/tenants');
    return response.data;
};
