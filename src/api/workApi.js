import api from "./api";

export const getWorks = async () => {
    const res = await api.get("/api/works");
    return res.data;
};

export const getWorkById = async (id) => {
    const res = await api.get(`/api/works/${id}`);
    return res.data;
};

export const createWork = async (data) => {
    const res = await api.post("/api/works", data);
    return res.data;
};

export const updateWork = async (id, data) => {
    const res = await api.put(`/api/works/${id}`, data);
    return res.data;
};

export const deleteWork = async (id) => {
    const res = await api.delete(`/api/works/${id}`);
    return res.data;
};