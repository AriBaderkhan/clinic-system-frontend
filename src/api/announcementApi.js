import api from './api';

// ── Platform admin ──
export const createAnnouncement = async (form, file) => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
        if (Array.isArray(v)) v.forEach((item) => fd.append(k, item)); // e.g. target_roles[]
        else fd.append(k, v ?? '');
    });
    if (file) fd.append('images', file); // reuse the shared 'images' upload field
    const res = await api.post('/api/announcements', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};

export const getAdminAnnouncements = async (planId) => {
    const res = await api.get('/api/announcements/admin', { params: planId ? { plan_id: planId } : {} });
    return res.data;
};

export const deleteAnnouncement = async (id) => {
    const res = await api.delete(`/api/announcements/${id}`);
    return res.data;
};

// ── tenant_manager / branch_manager ──
export const getMyAnnouncements = async () => {
    const res = await api.get('/api/announcements/me');
    return res.data;
};

export const markAnnouncementRead = async (id) => {
    const res = await api.post(`/api/announcements/${id}/read`);
    return res.data;
};
