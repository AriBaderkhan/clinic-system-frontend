import api from "./api";

export const createPatient = async (data) => {
    const res = await api.post("/api/patients", data);
    return res.data;
};

export const getAllPatients = async (params = {}) => {
    const res = await api.get("/api/patients", { params });
    return res.data;
};

export const getPatientById = async (patientId) => {
    const res = await api.get(`/api/patients/${patientId}`);
    return res.data;
};

export const editPatient = async (patientId, data) => {
    const res = await api.put(`/api/patients/${patientId}`, data);
    return res.data;
};

export const deletePatient = async (patientId) => {
    const res = await api.delete(`/api/patients/${patientId}`);
    return res.data;
};

export const searchPatients = async (q) => {
    const res = await api.get("/api/patients/search", { params: { q } });
    return res.data;
};

export const getReferralSources = async () => {
    const res = await api.get("/api/patients/referral-sources");
    return res.data;
};

export const getPatientAppointments = async (patientId) => {
    const res = await api.get(`/api/patients/${patientId}/appointments`);
    return res.data;
};

export const getPatientSessions = async (patientId, params = {}) => {
    const res = await api.get(`/api/patients/${patientId}/sessions`, { params });
    return res.data;
};

export const getPatientPayments = async (patientId) => {
    const res = await api.get(`/api/patients/${patientId}/payments`);
    return res.data;
};