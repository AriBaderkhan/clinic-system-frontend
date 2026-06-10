import api from './api';

export const getFeatures = async () => {
    const res = await api.get('/api/features');
    return res.data;
};

export const createFeature = async (data) => {
    const res = await api.post('/api/features', data);
    return res.data;
};

export const assignFeatureToPlan = async (planId, featureId) => {
    const res = await api.post(`/api/features/plan/${planId}`, { feature_id: featureId });
    return res.data;
};

export const removeFeatureFromPlan = async (planId, featureId) => {
    const res = await api.delete(`/api/features/plan/${planId}/feature/${featureId}`);
    return res.data;
};

export const getPlanFeatures = async (planId) => {
    const res = await api.get(`/api/features/plan/${planId}`);
    return res.data;
};