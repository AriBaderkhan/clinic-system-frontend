import api from "./api";

export const getSpecialties = async () => {
    const res = await api.get("/api/specialties");
    return res.data;
};

export const createSpecialty = async (data) => {
    const res = await api.post("/api/specialties", data);
    return res.data;
};

export const updateSpecialty = async (id, data) => {
    const res = await api.put(`/api/specialties/${id}`, data);
    return res.data;
};

export const deleteSpecialty = async (id) => {
    const res = await api.delete(`/api/specialties/${id}`);
    return res.data;
};

// a doctor's specialty + extra treatments
export const getDoctorSettings = async (doctorId) => {
    const res = await api.get(`/api/docs/${doctorId}/settings`);
    return res.data;
};

export const saveDoctorSettings = async (doctorId, data) => {
    const res = await api.put(`/api/docs/${doctorId}/settings`, data);
    return res.data;
};
