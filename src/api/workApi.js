import api from "./api";

export const getWorks = () => api.get("/api/works");
export const getWorkById = (id) => api.get(`/api/works/${id}`);
export const createWork = (data) => api.post("/api/works", data);
export const updateWork = (id, data) => api.put(`/api/works/${id}`, data);
export const deleteWork = (id) => api.delete(`/api/works/${id}`);