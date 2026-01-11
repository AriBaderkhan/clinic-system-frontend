import api from "./api";

 const createPatient = (data) => api.post("/api/patients", data);
 const getAllPatients = (q) => api.get("/api/patients", { params: { q } });
 const getPatientById = (patientId) =>
  api.get(`/api/patients/${patientId}`);
 const editPatient = (patientId, data) =>
  api.put(`/api/patients/${patientId}`, data);
 const deletePatient = (patientId) =>
  api.delete(`/api/patients/${patientId}`);
 
 const searchPatients = (q) =>
  api.get("/api/patients/search", { params: { q } });

// 🔹 NEW:
 const getPatientAppointments = (patientId) =>
  api.get(`/api/patients/${patientId}/appointments`);

 const getPatientSessions = (patientId) =>
  api.get(`/api/patients/${patientId}/sessions`);

 const getPatientPayments = (patientId) =>
  api.get(`/api/patients/${patientId}/payments`);

const patientApi = {
  createPatient,
  getAllPatients,
  getPatientById,
  editPatient,
  deletePatient,
  searchPatients,
  getPatientAppointments,   // NEW
  getPatientSessions,       // NEW
  getPatientPayments,       // NEW
};

export default patientApi;
