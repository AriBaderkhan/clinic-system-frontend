import api from './api';

// The 48h "due reminders" list (nearest first), each with ready messages + phone.
export const getUpcomingReminders = async () => {
    const res = await api.get('/api/reminders/upcoming');
    return res.data;
};

// The branch's editable standard template (kur_msg / arb_msg / eng_msg).
export const getReminderTemplate = async () => {
    const res = await api.get('/api/reminders/template');
    return res.data;
};

export const updateReminderTemplate = async (data) => {
    const res = await api.put('/api/reminders/template', data);
    return res.data;
};

// Log a reminder as sent → the appointment drops off the list.
export const markReminderSent = async (appointmentId, data) => {
    const res = await api.post(`/api/reminders/${appointmentId}/sent`, data);
    return res.data;
};
