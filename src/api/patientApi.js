import api from "./api";

export const createPatient = (data) => api.post("/api/patients", data);
export const getAllPatients = (q) => api.get("/api/patients", { params: { q } });
export const getPatientById = (patientId) => api.get(`/api/patients/${patientId}`);
export const editPatient = (patientId, data) => api.put(`/api/patients/${patientId}`, data);
export const deletePatient = (patientId) => api.delete(`/api/patients/${patientId}`);
export const searchPatients = (q) => api.get("/api/patients/search", { params: { q } });
export const getPatientAppointments = (patientId) => api.get(`/api/patients/${patientId}/appointments`);
export const getPatientSessions = (patientId) => api.get(`/api/patients/${patientId}/sessions`);
export const getPatientPayments = (patientId) => api.get(`/api/patients/${patientId}/payments`);
