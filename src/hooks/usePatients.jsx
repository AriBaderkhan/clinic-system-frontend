// src/hooks/usePatients.jsx
import { useCallback, useEffect, useState } from "react";
import patientApi from "../api/patientApi";

function usePatients(options = {}) {
  const { skipFetch = false } = options;

  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(!skipFetch); // true only when we will fetch
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // for create/update/delete

  const fetchPatients = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const res = await patientApi.getAllPatients();

      // backend sends: { message, patients: [...] }
      const data = res.data;
      const list = Array.isArray(data)
        ? data
        : data.patients || data.data || [];

      setPatients(list);
    } catch (err) {
      console.error("Failed to load patients:", err);
      setError("Could not load patients. Please try again.");
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // CREATE patient (used by AddPatient page)
  const createPatients = useCallback(
    async (payload) => {
      try {
        setIsSubmitting(true);
        setError("");

        const res = await patientApi.createPatient(payload);

        if (!skipFetch) {
          await fetchPatients();
        }
        const data = res.data;
        // Return a success object instead of nothing
        return { ok: true, data };
      } catch (err) {
        const backendMsg = err.response?.data?.message;
        console.error("🔥 Create patient error:", backendMsg || err);

        const msg = backendMsg || "Could not create patient. Please try again.";
        setError(msg);

        // Return a failure object instead of throwing
        return { ok: false, error: msg };
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchPatients, skipFetch]
  );

  // ----- UPDATE -----
  const updatePatient = useCallback(
    async (patientId, payload) => {
      try {
        setIsSubmitting(true);
        setError("");

        const res = await patientApi.editPatient(patientId, payload);

        if (!skipFetch) {
          await fetchPatients();
        }

        return { ok: true, data: res.data };
      } catch (err) {
        const backend = err.response?.data;
        console.error("🔥 Update patient error:", backend || err);

        const msg =
          backend?.message ||
          "Could not update patient. Please try again.";

        setError(msg);
        return { ok: false, error: msg };
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchPatients, skipFetch]
  );

  // ----- DELETE -----
  const deletePatient = useCallback(
    async (patientId) => {
      try {
        setIsSubmitting(true);
        setError("");

        await patientApi.deletePatient(patientId);

        if (!skipFetch) {
          await fetchPatients();
        }

        return { ok: true };
      } catch (err) {
        const backend = err.response?.data;
        console.error("🔥 Delete patient error:", backend || err);

        const msg =
          backend?.message ||
          "Could not delete patient. Please try again.";

        setError(msg);
        return { ok: false, error: msg };
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchPatients, skipFetch]
  );
  // initial load for list pages
  useEffect(() => {
    if (!skipFetch) {
      fetchPatients();
    }
  }, [fetchPatients, skipFetch]);

  return {
    patients,
    isLoading,
    error,
    refresh: fetchPatients,
    createPatients,
    updatePatient,
    deletePatient,
    isSubmitting,
  };
}

export default usePatients;
