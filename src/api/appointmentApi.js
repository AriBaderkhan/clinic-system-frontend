import api from './api';

export const createAppointment = async (data) => {
    const res = await api.post('/api/appointments', data);
    return res.data;
};

export const getAllAppointments = async (params = {}) => {
    const res = await api.get('/api/appointments', { params });
    return res.data;
};

export const getAppointmentById = async (appointmentId) => {
    const res = await api.get(`/api/appointments/${appointmentId}`);
    return res.data;
};

export const editAppointment = async (appointmentId, data) => {
    const res = await api.put(`/api/appointments/${appointmentId}`, data);
    return res.data;
};

export const deleteAppointment = async (appointmentId) => {
    const res = await api.delete(`/api/appointments/${appointmentId}`);
    return res.data;
};

export const getCalendarAppointments = async (params = {}) => {
    const res = await api.get('/api/appointments/calendar', { params });
    return res.data;
};

export const getActiveTodayAppointments = async () => {
    const res = await api.get('/api/appointments/active/today');
    return res.data;
};

export const checkInAppointment = async (appointmentId) => {
    const res = await api.patch(`/api/appointments/${appointmentId}/checked-in`);
    return res.data;
};

export const inProgressAppointment = async (appointmentId) => {
    const res = await api.patch(`/api/appointments/${appointmentId}/in_progress`);
    return res.data;
};

export const completeAppointmentWithSession = async (appointmentId, payload) => {
    const res = await api.post(`/api/appointments/${appointmentId}/completed`, payload);
    return res.data;
};

export const cancelAppointment = async (appointmentId, data) => {
    const res = await api.patch(`/api/appointments/${appointmentId}/cancelled`, data);
    return res.data;
};

export const noShowAppointment = async (appointmentId, data) => {
    const res = await api.patch(`/api/appointments/${appointmentId}/no_show`, data);
    return res.data;
};

export const getSessionByAppointmentId = async (appointmentId) => {
    const res = await api.get(`/api/appointments/${appointmentId}/session`);
    return res.data;
};