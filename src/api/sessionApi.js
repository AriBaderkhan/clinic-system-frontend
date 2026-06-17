import api from "./api";

export const getUnpaidSessions = async (params = {}) => {
    const res = await api.get("/api/sessions/unpaid", { params });
    return res.data;
};

export const paySession = async (sessionId, payload) => {
    const res = await api.post(`/api/sessions/${sessionId}/pay`, payload);
    return res.data;
};

export const getAllSessions = async (params = {}) => {
    const res = await api.get("/api/sessions", { params });
    return res.data;
};

export const getNormalSessionDetails = async (sessionId) => {
    const res = await api.get(`/api/sessions/${sessionId}/normal`);
    return res.data;
};

export const updateNormalSession = async (sessionId, payload) => {
    const res = await api.put(`/api/sessions/${sessionId}/normal`, payload);
    return res.data;
};

export const deleteSession = async (sessionId) => {
    const res = await api.delete(`/api/sessions/${sessionId}`);
    return res.data;
};

// ── Case images ──────────────────────────────────────────────────────────
export const uploadSessionImages = async (sessionId, files) => {
    const form = new FormData();
    Array.from(files).forEach((f) => form.append("images", f));
    const res = await api.post(`/api/sessions/${sessionId}/images`, form, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
};

export const getSessionImages = async (sessionId) => {
    const res = await api.get(`/api/sessions/${sessionId}/images`);
    return res.data;
};

export const deleteSessionImage = async (sessionId, imageId) => {
    const res = await api.delete(`/api/sessions/${sessionId}/images/${imageId}`);
    return res.data;
};