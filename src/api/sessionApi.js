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

// session page 

export async function apiGetAllSessions(params = {}) {
  const res = await api.get("/api/sessions", { params });
  return res.data; // { message, sessions }
}

// GET /api/sessions/:id/normal
export async function apiGetNormalSessionDetails(sessionId) {
  const res = await api.get(`/api/sessions/${sessionId}/normal`);
  return res.data; // { message, data: { session, works_summary } }
}

// edit (normal session)
export async function updateNormalSession(sessionId, payload) {
  // if your backend is PUT instead of PATCH, change it.
  const res = await api.put(`/api/sessions/${sessionId}/normal`, payload);
  return res.data;
}