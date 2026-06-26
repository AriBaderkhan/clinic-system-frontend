import api from './api';

// Tenant activity log. Filters: q (user name), from/to (YYYY-MM-DD), page.
export const getAuditLogs = async (params = {}) => {
    const res = await api.get('/api/audit', { params });
    return res.data;
};
