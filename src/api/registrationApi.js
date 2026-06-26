import api from './api';

// ── Public signup ──
export const sendRegisterCode = async (email) => {
    const res = await api.post('/api/register/send-code', { email });
    return res.data;
};

export const verifyRegisterCode = async (email, code) => {
    const res = await api.post('/api/register/verify-code', { email, code });
    return res.data;
};

// All text fields + the payment-evidence image (field name 'images', same as the
// rest of the app's uploads).
export const registerTenant = async (form, file) => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''));
    fd.append('images', file);
    const res = await api.post('/api/register', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};

// ── Platform admin: review registrations ──
export const getRegistrationRequests = async () => {
    const res = await api.get('/api/register/requests');
    return res.data;
};

export const approveRegistrationRequest = async (id) => {
    const res = await api.post(`/api/register/requests/${id}/approve`);
    return res.data;
};

export const rejectRegistrationRequest = async (id, note) => {
    const res = await api.post(`/api/register/requests/${id}/reject`, { note });
    return res.data;
};
