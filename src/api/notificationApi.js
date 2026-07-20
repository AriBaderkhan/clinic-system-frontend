import api from './api';

export const getMyNotifications = async () => {
    const res = await api.get('/api/notifications');
    return res.data;
};

export const markNotificationRead = async (id) => {
    const res = await api.post(`/api/notifications/${id}/read`);
    return res.data;
};

export const markAllNotificationsRead = async () => {
    const res = await api.put('/api/notifications/read-all');
    return res.data;
};
