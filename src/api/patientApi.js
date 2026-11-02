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
// ---- sharing with other branches of the clinic ----
// { home, is_home, shared_with, shared_here, can_share_to }
export const getPatientShares = async (patientId) => {
    const res = await api.get(`/api/patients/${patientId}/shares`);
    return res.data;
};

export const sharePatient = async (patientId, branchId) => {
    const res = await api.post(`/api/patients/${patientId}/shares`, { branch_id: branchId });
    return res.data;
};

export const unsharePatient = async (patientId, branchId) => {
    const res = await api.delete(`/api/patients/${patientId}/shares/${branchId}`);
    return res.data;
};

// before adding a patient: { elsewhere: [{ branch_id, branch_name }] }
export const checkPatientPhone = async (phone) => {
    const res = await api.get(`/api/patients/phone-check`, { params: { phone } });
    return res.data;
};
