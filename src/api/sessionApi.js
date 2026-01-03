// src/api/sessionApi.js
import api from "./api"; // your configured axios

export async function getUnpaidSessions() {
  const res = await api.get("/api/sessions/unpaid");
  return res.data; // { message, data }
}

export async function paySession(sessionId, payload) {
  const res = await api.post(`/api/sessions/${sessionId}/pay`, payload);
  return res.data;
}
