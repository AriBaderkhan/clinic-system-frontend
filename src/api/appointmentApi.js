import api from './api';

export const createAppointment = (data) => api.post('/api/appointments',data);
export const getAllAppointments = (params = {}) => api.get("/api/appointments", { params });
export const getAppointmentById = (appointmentId) => api.get(`/api/appointments/${appointmentId}`);
export const editAppointment = (appointmentId, data) => api.put(`/api/appointments/${appointmentId}`,data);
export const deleteAppointment = (appointmentId) => api.delete(`/api/appointments/${appointmentId}`);
export const getActiveTodayAppointments = () => api.get("/api/appointments/active/today");
export const checkInAppointment = (appointmentId) => api.patch(`/api/appointments/${appointmentId}/checked-in`);
export const inProgressAppointment = (appointmentId) => api.patch(`/api/appointments/${appointmentId}/in_progress`);
export async function completeAppointmentWithSession(appointmentId, payload) {
  // payload = { next_plan, notes, works: [...] }
  const res = await api.post(
    `/api/appointments/${appointmentId}/completed`,
    payload
  );
  return res.data;
}
export const cancelAppointment = (appointmentId, data) => api.patch(`/api/appointments/${appointmentId}/cancelled`, data);
export const noShowAppointment = (appointmentId, data) => api.patch(`/api/appointments/${appointmentId}/no_show`, data);

export const getSessionByAppointmentId = (appointmentId) =>
  api.get(`/api/appointments/${appointmentId}/session`);
const appointmentApi= {
    createAppointment, getAllAppointments, getAppointmentById, editAppointment, deleteAppointment, 
    checkInAppointment, inProgressAppointment, completeAppointmentWithSession, cancelAppointment, noShowAppointment,
    getActiveTodayAppointments, getSessionByAppointmentId
}

export default appointmentApi;