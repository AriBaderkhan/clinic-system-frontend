import api from './api';

export const getMyProfile = async () => {
    const res = await api.get('/api/profile/me');
    return res.data;
};

// Details (+ optional avatar image, field name 'images' like the rest of the app).
export const updateMyProfile = async (form, file) => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''));
    if (file) fd.append('images', file);
    const res = await api.put('/api/profile/me', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};

export const changeMyPassword = async (currentPassword, newPassword) => {
    const res = await api.put('/api/profile/me/password', { currentPassword, newPassword });
    return res.data;
};

export const sendEmailChangeCode = async (email) => {
    const res = await api.post('/api/profile/me/email/send-code', { email });
    return res.data;
};

export const changeMyEmail = async (email, code) => {
    const res = await api.put('/api/profile/me/email', { email, code });
    return res.data;
};
