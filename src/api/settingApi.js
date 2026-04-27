import api from './api';

export const getEffectiveSettings = async () => {
    // Mounted at /api/settings in main.js
    const response = await api.get('/api/settings/effective');
    return response.data;
};
