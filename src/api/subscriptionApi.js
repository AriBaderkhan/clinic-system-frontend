import api from './api';

export const getAllSubscriptions = async () => {
    const response = await api.get('/api/subscriptions');
    return response.data;
};

export const createSubscription = async (tenantId, planId) => {
    // POST /api/subscriptions/:tenantId
    const response = await api.post(`/api/subscriptions/${tenantId}`, { plan_id: planId });
    return response.data;
};

export const updateSubscription = async (subscriptionId, tenantId, planId) => {
    // PUT /api/subscriptions/:SubscriptionId/tenant/:tenantId
    const response = await api.put(`/api/subscriptions/${subscriptionId}/tenant/${tenantId}`, { plan_id: planId });
    return response.data;
};

export const getSubscription = async (subscriptionId) => {
    const response = await api.get(`/api/subscriptions/${subscriptionId}`);
    return response.data;
};
