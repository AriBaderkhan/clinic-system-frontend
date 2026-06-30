import { useCallback, useState } from "react";
import { getSessionsForTreatmentPlan } from "../api/treatmentPlanApi";

export default function useTreatmentPlanSessions() {
  const [cache, setCache] = useState({});

  const load = useCallback(async (planId) => {
    const key = String(planId);

    let shouldFetch = true;
    setCache((prev) => {
      if (prev[key]?.sessions?.length && !prev[key]?.error) {
        shouldFetch = false;
        return prev;
      }
      return { ...prev, [key]: { loading: true, error: "", sessions: prev[key]?.sessions || [] } };
    });

    if (!shouldFetch) return;

    try {
      const res = await getSessionsForTreatmentPlan(planId);
      setCache((prev) => ({
        ...prev,
        [key]: { loading: false, error: "", sessions: Array.isArray(res.data) ? res.data : [] },
      }));
    } catch (err) {
      setCache((prev) => ({
        ...prev,
        [key]: { loading: false, error: err.userMessage || "Could not load sessions.", sessions: [] },
      }));
    }
  }, []);

  // Force a refetch for one plan (ignores the cache) — used after editing a
  // session so the sub-table reflects the change.
  const reload = useCallback(async (planId) => {
    const key = String(planId);
    setCache((prev) => ({ ...prev, [key]: { loading: true, error: "", sessions: prev[key]?.sessions || [] } }));
    try {
      const res = await getSessionsForTreatmentPlan(planId);
      setCache((prev) => ({
        ...prev,
        [key]: { loading: false, error: "", sessions: Array.isArray(res.data) ? res.data : [] },
      }));
    } catch (err) {
      setCache((prev) => ({
        ...prev,
        [key]: { loading: false, error: err.userMessage || "Could not load sessions.", sessions: [] },
      }));
    }
  }, []);

  return { cache, load, reload };
}