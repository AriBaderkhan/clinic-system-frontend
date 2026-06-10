import api from './api';

export const getBranch = async (id) => {
    const res = await api.get(`/api/branches/${id}`);
    return res.data;
};

export const updateBranch = async (id, data) => {
    const res = await api.put(`/api/branches/${id}`, data);
    return res.data;
};