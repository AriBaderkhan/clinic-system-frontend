import api from "./api";

export const fetchPaymentHistory = async () => {
    const res = await api.get("/api/history/payments");
    return res.data;
};

export const fetchSessionDetails = async (sessionId) => {
    const res = await api.get(`/api/history/session/${sessionId}/details`);
    return res.data;
};