import api from './api';

export const getAllSubscriptions = async () => {
    const res = await api.get('/api/subscriptions');
    return res.data;
};

export const createSubscription = async (tenantId, planId) => {
    const res = await api.post(`/api/subscriptions/${tenantId}`, { plan_id: planId });
    return res.data;
};

export const updateSubscription = async (subscriptionId, tenantId, planId) => {
    const res = await api.put(`/api/subscriptions/${subscriptionId}/tenant/${tenantId}`, { plan_id: planId });
    return res.data;
};

export const getSubscription = async (subscriptionId) => {
    const res = await api.get(`/api/subscriptions/${subscriptionId}`);
    return res.data;
};