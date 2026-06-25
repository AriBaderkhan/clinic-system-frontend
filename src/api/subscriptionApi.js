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

// ── Tenant self-service ──
export const getMySubscription = async () => {
    const res = await api.get('/api/subscriptions/me');
    return res.data;
};

export const getMyFeatures = async () => {
    const res = await api.get('/api/subscriptions/me/features');
    return res.data;
};

// plan_id + payment-evidence image (field name 'images', same as session images)
export const createSubscriptionRequest = async (planId, file) => {
    const form = new FormData();
    form.append('plan_id', planId);
    form.append('images', file);
    const res = await api.post('/api/subscriptions/request', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};

// ── Platform admin: review the manual payment requests ──
export const getSubscriptionRequests = async () => {
    const res = await api.get('/api/subscriptions/requests');
    return res.data;
};

export const approveSubscriptionRequest = async (requestId) => {
    const res = await api.post(`/api/subscriptions/requests/${requestId}/approve`);
    return res.data;
};

export const rejectSubscriptionRequest = async (requestId, note) => {
    const res = await api.post(`/api/subscriptions/requests/${requestId}/reject`, { note });
    return res.data;
};