import api from "./api";

// ===================== LABS =====================

export const createLab = async (data) => {
    const res = await api.post("/api/labs", data);
    return res.data;
};

export const getAllLabs = async (params = {}) => {
    const res = await api.get("/api/labs", { params });
    return res.data;
};

export const searchLabs = async (q) => {
    const res = await api.get("/api/labs/search", { params: { q } });
    return res.data;
};

export const getLabById = async (labId) => {
    const res = await api.get(`/api/labs/${labId}`);
    return res.data;
};

export const editLab = async (labId, data) => {
    const res = await api.put(`/api/labs/${labId}`, data);
    return res.data;
};

export const deleteLab = async (labId) => {
    const res = await api.delete(`/api/labs/${labId}`);
    return res.data;
};

// ===================== ORDERS =====================

export const createLabOrder = async (data) => {
    const res = await api.post("/api/labs/orders", data);
    return res.data;
};

export const getAllLabOrders = async (params = {}) => {
    const res = await api.get("/api/labs/orders", { params });
    return res.data;
};

export const getLabOrderById = async (orderId) => {
    const res = await api.get(`/api/labs/orders/${orderId}`);
    return res.data;
};

export const editLabOrder = async (orderId, data) => {
    const res = await api.put(`/api/labs/orders/${orderId}`, data);
    return res.data;
};

export const setLabOrderStatus = async (orderId, status) => {
    const res = await api.patch(`/api/labs/orders/${orderId}/status`, { status });
    return res.data;
};

export const deleteLabOrder = async (orderId) => {
    const res = await api.delete(`/api/labs/orders/${orderId}`);
    return res.data;
};
