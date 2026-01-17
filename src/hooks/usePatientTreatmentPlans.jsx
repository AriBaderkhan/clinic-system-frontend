// src/hooks/usePatientTreatmentPlans.js
import { useEffect, useState } from "react";
import { getPatientTreatmentPlans } from "../api/treatmentPlanApi";

export default function usePatientTreatmentPlans(patientId) {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) return;

    let ignore = false;
    (async () => {
      try {
        setIsLoading(true);
        setError("");
        const data = await getPatientTreatmentPlans(patientId);
        if (!ignore) setPlans(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!ignore) setError(err.userMessage);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [patientId]);

  return { plans, isLoading, error };
}
