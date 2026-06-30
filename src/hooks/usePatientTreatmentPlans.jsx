import { useCallback, useEffect, useState } from "react";
import { getPatientTreatmentPlans } from "../api/treatmentPlanApi";

export default function usePatientTreatmentPlans(patientId) {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPlans = useCallback(async () => {
    if (!patientId) return;
    try {
      setIsLoading(true);
      setError("");
      const res = await getPatientTreatmentPlans(patientId);
      setPlans(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.userMessage || "Could not load treatment plans.");
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return { plans, isLoading, error, refresh: fetchPlans };
}