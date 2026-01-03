// src/api/paymentApi.js
import api from "./api"; 

// GET /payments/history
export async function fetchPaymentHistory() {
  const res = await api.get("/api/history/payments");
  // backend returns: { message, data: [...] }
  return res.data?.data || [];
}

export async function fetchSessionDetails(sessionId) {
  const res = await api.get(`/api/history/session/${sessionId}/details`);
  // backend returns: { message, data: { session, works_summary, payments } }
  return res.data?.data || null;
}