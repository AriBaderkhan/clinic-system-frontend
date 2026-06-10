import api from './api';

export const getEffectiveSettings = async () => {
    const res = await api.get('/api/settings/effective');
    return res.data;
};