import { useEffect, useState } from "react";
import { getPatientTreatmentPlans } from "../api/treatmentPlanApi";

export default function usePatientTreatmentPlans(patientId) {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) return;

    let isMounted = true;
    (async () => {
      try {
        setIsLoading(true);
        setError("");
        const data = await getPatientTreatmentPlans(patientId);
        if (isMounted) setPlans(Array.isArray(data) ? data : []);
      } catch (err) {
        if (isMounted) setError(err.userMessage);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [patientId]);

  return { plans, isLoading, error };
}
