import api from "./api";

export const getActiveTreatmentPlan = async (patientId, type) => {
    const res = await api.get("/api/treatment-plans/active", {
        params: { patientId, type },
    });
    return res.data;
};

export const getPatientTreatmentPlans = async (patientId) => {
    const res = await api.get(`/api/patients/${patientId}/treatment-plans`);
    return res.data;
};

export const getSessionsForTreatmentPlan = async (treatmentPlanId) => {
    const res = await api.get(`/api/treatment-plans/${treatmentPlanId}/sessions`);
    return res.data;
};

export const getAllTreatmentPlansForSection = async ({ isPaid, isCompleted, q, page, limit }) => {
    const res = await api.get("/api/treatment-plans", {
        params: { isPaid, isCompleted, q, page, limit },
    });
    return res.data;
};

export const editTreatmentPlan = async (tpId, payload) => {
    const res = await api.patch(`/api/treatment-plans/${tpId}`, payload);
    return res.data;
};

export const deleteTreatmentPlan = async (tpId) => {
    const res = await api.delete(`/api/treatment-plans/${tpId}`);
    return res.data;
};

export const updatePaidForTpSession = async (tpId, sessionId, amount) => {
    const res = await api.patch(
        `/api/treatment-plans/${tpId}/sessions/${sessionId}/paid`,
        { amount }
    );
    return res.data;
};