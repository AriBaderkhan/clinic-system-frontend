import api from './api';

// Public — auth routes live at the root (no /api prefix), same as /login.
export const forgotPassword = async (email) => {
    const res = await api.post('/forgot-password', { email });
    return res.data;
};

export const resetPassword = async (email, code, newPassword) => {
    const res = await api.post('/reset-password', { email, code, newPassword });
    return res.data;
};
