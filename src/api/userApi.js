import api from './api';

export const createUser = async (data) => {
    const res = await api.post('/api/users', data);
    return res.data;
};

export const getAllUsers = async () => {
    const res = await api.get('/api/users');
    return res.data;
};

export const assignUserToBranch = async (userId, data) => {
    const res = await api.post(`/api/users/${userId}/assign`, data);
    return res.data;
};

export const updateUser = async (id, data) => {
    const res = await api.put(`/api/users/${id}`, data);
    return res.data;
};

export const getRoles = async () => {
    const res = await api.get('/api/users/roles');
    return res.data;
};

export const getUserById = async (id) => {
    const res = await api.get(`/api/users/${id}`);
    return res.data;
};

export const deactivateUser = async (id) => {
    const res = await api.delete(`/api/users/${id}`);
    return res.data;
};

export const switchBranch = async (data) => {
    const res = await api.post('/api/auth/switch-branch', data);
    return res.data;
};