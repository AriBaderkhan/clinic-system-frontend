import api from './api';

export const getEffectiveSettings = async () => {
    const res = await api.get('/api/settings/effective');
    return res.data;
};

// the branch's workflow switches (settle, discounts, booking while owing)
export const getWorkflow = async () => {
    const res = await api.get('/api/settings/workflow');
    return res.data;
};

export const updateWorkflow = async (data) => {
    const res = await api.put('/api/settings/workflow', data);
    return res.data;
};
