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

// 1) list all TPs (for reception section) with filters + search
export async function getAllTreatmentPlansForSection({ isPaid, isCompleted, q }) {
  const res = await api.get("/api/treatment-plans", {
    params: {
      isPaid,        // true/false/undefined
      isCompleted,   // true/false/undefined
      q,             // search by patient name
    },
  });
  return res.data?.data ?? [];
}

// 2) edit TP (type / agreed_total)
export async function editTreatmentPlan(tpId, payload) {
  // payload can be { type } or { agreed_total } or { type, agreed_total }
  const res = await api.patch(`/api/treatment-plans/${tpId}`, payload);
  return res.data?.data ?? null;
}

// 3) delete TP
export async function deleteTreatmentPlan(tpId) {
  const res = await api.delete(`/api/treatment-plans/${tpId}`);
  return res.data ?? null; // 204 => usually no body
}

// 4) edit paid in one TP session
export async function updatePaidForTpSession(tpId, sessionId, amount) {
  const res = await api.patch(
    `/api/treatment-plans/${tpId}/sessions/${sessionId}/paid`,
    { amount }
  );
  return res.data?.data ?? null;
}