import api from "./api";

export const getAllDoctors = async () => {
    const res = await api.get("/api/docs");
    return res.data;
};

export const getActiveTodayApptsPerDoc = async () => {
    const res = await api.get("/api/docs/active/appointments/today");
    return res.data;
};

export const getAllApptsPerDoc = async (params = {}) => {
    const res = await api.get("/api/docs/appointments/per-doctor", { params });
    return res.data;
};