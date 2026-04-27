import api from './api';

export const getFeatures = async () => {
    const response = await api.get('/api/features');
    return response.data;
};

export const createFeature = async (data) => {
    const response = await api.post('/api/features', data);
    return response.data;
};

export const assignFeatureToPlan = async (planId, featureId) => {
    const response = await api.post(`/api/features/plan/${planId}`, { feature_id: featureId });
    return response.data;
};

export const removeFeatureFromPlan = async (planId, featureId) => {
    const response = await api.delete(`/api/features/plan/${planId}/feature/${featureId}`);
    return response.data;
};

export const getPlanFeatures = async (planId) => {
    const response = await api.get(`/api/features/plan/${planId}`);
    return response.data;
};
