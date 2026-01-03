// src/api/treatmentPlanApi.js
import api from "./api"; // your axios instance (the same used in other api files)

export async function getActiveTreatmentPlan(patientId, type) {
  const res = await api.get("/api/treatment-plans/active", {
    params: { patientId, type },
  });
  // backend should return { success:true, data: planOrNull }
  return res.data?.data ?? null;
}

export async function getPatientTreatmentPlans(patientId) {
  const res = await api.get(`/api/patients/${patientId}/treatment-plans`);
  return res.data?.data ?? [];
}

// list sessions for one treatment plan
export async function getSessionsForTreatmentPlan(treatmentPlanId) {
  const res = await api.get(`/api/treatment-plans/${treatmentPlanId}/sessions`);
  return res.data?.data ?? [];
}