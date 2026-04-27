import api from './api';

export const createUser = async (data) => {
    const response = await api.post('/api/users', data);
    return response.data;
};

export const getAllUsers = async () => {
    const response = await api.get('/api/users');
    return response.data.data; // Controller returns { message, data: [...] }
};

// Assign user to a branch
export const assignUserToBranch = async (userId, data) => {
    const response = await api.post(`/api/users/${userId}/assign`, data);
    return response.data.data;
};

export const updateUser = async (id, data) => {
    const response = await api.put(`/api/users/${id}`, data);
    return response.data;
};

export const getRoles = async () => {
    const response = await api.get('/api/users/roles');
    return response.data.data; // Controller returns { message, data: [...] }
};

export const getUserById = async (id) => {
    const response = await api.get(`/api/users/${id}`);
    return response.data.data;
};

export const switchBranch = async (data) => {
    const response = await api.post('/switch-branch', data);
    return response.data;
};
