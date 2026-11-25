import api from "./api";

// one page of the payment history (+ totals over all payments)
export const fetchPaymentHistory = async (page = 1) => {
    const res = await api.get("/api/history/payments", { params: { page } });
    return res.data;
};

export const fetchSessionDetails = async (sessionId) => {
    const res = await api.get(`/api/history/session/${sessionId}/details`);
    return res.data;
};