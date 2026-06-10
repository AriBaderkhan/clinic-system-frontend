import { useCallback, useEffect, useState } from "react";
import { getAllPatients, createPatient, editPatient, deletePatient as deletePatientApi } from "../api/patientApi";

export default function usePatients(options = {}) {
  const { skipFetch = false } = options;

  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(!skipFetch);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 20 });

  const q = options.search?.trim() || "";
  const pageLimit = 20;

  useEffect(() => {
    setPage(1);
  }, [q]);

  const fetchPatients = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const res = await getAllPatients({ q: q || undefined, page, limit: pageLimit });
      setPatients(res.data ?? []);
      setPagination({
        total: res.total ?? 0,
        page,
        limit: pageLimit,
        totalPages: Math.ceil((res.total ?? 0) / pageLimit) || 1,
      });
    } catch (err) {
      setError(err.userMessage || "Could not load patients. Please try again.");
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  }, [q, page]);

  const createPatients = useCallback(
    async (payload) => {
      try {
        setIsSubmitting(true);
        setError("");
        const res = await createPatient(payload);
        if (!skipFetch) await fetchPatients();
        return { ok: true, data: res.data };
      } catch (err) {
        setError(err.userMessage || "Could not create patient. Please try again.");
        return { ok: false, error: err.userMessage || "Could not create patient. Please try again." };
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchPatients, skipFetch]
  );

  const updatePatient = useCallback(
    async (patientId, payload) => {
      try {
        setIsSubmitting(true);
        setError("");
        const res = await editPatient(patientId, payload);
        if (!skipFetch) await fetchPatients();
        return { ok: true, data: res.data };
      } catch (err) {
        setError(err.userMessage || "Could not update patient. Please try again.");
        return { ok: false, error: err.userMessage || "Could not update patient. Please try again." };
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchPatients, skipFetch]
  );

  const deletePatient = useCallback(
    async (patientId) => {
      try {
        setIsSubmitting(true);
        setError("");
        await deletePatientApi(patientId);
        if (!skipFetch) await fetchPatients();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err.userMessage || "Could not delete patient. Please try again." };
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchPatients, skipFetch]
  );

  useEffect(() => {
    if (!skipFetch) fetchPatients();
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
    page,
    setPage,
    pagination,
  };
}