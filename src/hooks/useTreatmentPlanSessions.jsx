// src/hooks/useTreatmentPlanSessions.js
import { useState } from "react";
import { getSessionsForTreatmentPlan } from "../api/treatmentPlanApi";

export default function useTreatmentPlanSessions() {
  // cache: { [planId]: { loading, error, sessions } }
  const [cache, setCache] = useState({});

  const load = async (planId) => {
    const key = String(planId);

    // don’t refetch if already loaded successfully
    if (cache[key]?.sessions && !cache[key]?.error) return;

    setCache((prev) => ({
      ...prev,
      [key]: { loading: true, error: "", sessions: prev[key]?.sessions || [] },
    }));

    try {
      const data = await getSessionsForTreatmentPlan(planId);
      setCache((prev) => ({
        ...prev,
        [key]: { loading: false, error: "", sessions: Array.isArray(data) ? data : [] },
      }));
    } catch (e) {
      setCache((prev) => ({
        ...prev,
        [key]: {
          loading: false,
          error: e?.response?.data?.message || "Failed to load sessions for this plan.",
          sessions: [],
        },
      }));
    }
  };

  return { cache, load };
}
