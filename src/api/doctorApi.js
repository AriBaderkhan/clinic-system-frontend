import api from "./api";

const getAllDoctors = () => api.get("/api/docs");

const getActiveTodayApptsPerDoc = () => api.get("/api/docs/active/appointments/today");
export const getAllApptsPerDoc = (params = {}) => api.get("/api/docs/appointments/per-doctor", { params });

const doctorsApi = {
  getAllDoctors,
  getActiveTodayApptsPerDoc,
  getAllApptsPerDoc
};

export default doctorsApi;