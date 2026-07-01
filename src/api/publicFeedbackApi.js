import axios from 'axios';

// A BARE axios client (no auth interceptor, no token, no 401→login redirect) —
// the public feedback form is opened by patients who are not logged in.
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export const getPublicFeedback = async (token) => {
  const res = await publicApi.get(`/api/public/feedback/${token}`);
  return res.data;
};

export const submitPublicFeedback = async (token, payload) => {
  const res = await publicApi.post(`/api/public/feedback/${token}`, payload);
  return res.data;
};

// QR (walk-in, anonymous) — keyed by tenant + branch, no token.
export const getQrFeedback = async (tenantId, branchId) => {
  const res = await publicApi.get(`/api/public/feedback/qr/${tenantId}/${branchId}`);
  return res.data;
};

export const submitQrFeedback = async (tenantId, branchId, payload) => {
  const res = await publicApi.post(`/api/public/feedback/qr/${tenantId}/${branchId}`, payload);
  return res.data;
};
