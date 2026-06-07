import { useState, useEffect, useCallback } from "react";
import { getWorks, createWork, updateWork, deleteWork } from "../api/workApi";

export default function useWorks({ skipFetch = false } = {}) {
  const [works, setWorks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWorks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getWorks();
      setWorks(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      setError(err.userMessage || "Failed to load works");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!skipFetch) fetchWorks();
  }, [fetchWorks, skipFetch]);

  const create = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await createWork(data);
      await fetchWorks();
      return { ok: true, data: res.data };
    } catch (err) {
      return { ok: false, error: err.userMessage || "Failed to create work" };
    } finally {
      setIsSubmitting(false);
    }
  };

  const update = async (id, data) => {
    setIsSubmitting(true);
    try {
      const res = await updateWork(id, data);
      await fetchWorks();
      return { ok: true, data: res.data };
    } catch (err) {
      return { ok: false, error: err.userMessage || "Failed to update work" };
    } finally {
      setIsSubmitting(false);
    }
  };

  const remove = async (id) => {
    try {
      await deleteWork(id);
      await fetchWorks();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.userMessage || "Failed to delete work" };
    }
  };

  return { works, isLoading, error, refresh: fetchWorks, create, update, remove, isSubmitting };
}
