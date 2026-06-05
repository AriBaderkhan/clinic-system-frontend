import api from "./api";

export const getAllDoctors = () => api.get("/api/docs");
export const getActiveTodayApptsPerDoc = () => api.get("/api/docs/active/appointments/today");
export const getAllApptsPerDoc = (params = {}) => api.get("/api/docs/appointments/per-doctor", { params });
