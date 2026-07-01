import api from './api';

// ── Templates ────────────────────────────────────────────────────────────────
export const getFeedbackTemplate = async () => {
  const res = await api.get('/api/feedbacks/template');
  return res.data;
};
export const updateFeedbackTemplate = async (data) => {
  const res = await api.put('/api/feedbacks/template', data);
  return res.data;
};

// ── Feedback list: one row per patient needing feedback, paginated ───────────
export const getFeedbackAppointments = async (page = 1, limit = 20) => {
  const res = await api.get('/api/feedbacks/appointments', { params: { page, limit } });
  return res.data;
};

// ── Create / dismiss an invite ───────────────────────────────────────────────
// createFeedbackInvite returns { token } → used to build the public form link.
export const createFeedbackInvite = async (data) => {
  const res = await api.post('/api/feedbacks/invite', data);
  return res.data;
};
export const dismissFeedback = async (data) => {
  const res = await api.post('/api/feedbacks/dismiss', data);
  return res.data;
};

// ── Results (tenant_manager) ─────────────────────────────────────────────────
// Returns { overall, branches, responses } (tenant-wide, switch branch in UI).
export const getFeedbackResults = async () => {
  const res = await api.get('/api/feedbacks/results');
  return res.data;
};
