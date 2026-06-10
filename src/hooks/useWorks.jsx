import { useCallback, useEffect, useState } from "react";
import { getWorks, createWork, updateWork, deleteWork } from "../api/workApi";

export default function useWorks({ skipFetch = false } = {}) {
  const [works, setWorks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWorks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await getWorks();
      setWorks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.userMessage || "Failed to load works");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!skipFetch) fetchWorks();
  }, [fetchWorks, skipFetch]);

  const create = useCallback(async (data) => {
    try {
      setIsSubmitting(true);
      const res = await createWork(data);
      await fetchWorks();
      return { ok: true, data: res.data };
    } catch (err) {
      return { ok: false, error: err.userMessage || "Failed to create work" };
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchWorks]);

  const update = useCallback(async (id, data) => {
    try {
      setIsSubmitting(true);
      const res = await updateWork(id, data);
      await fetchWorks();
      return { ok: true, data: res.data };
    } catch (err) {
      return { ok: false, error: err.userMessage || "Failed to update work" };
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchWorks]);

  const remove = useCallback(async (id) => {
    try {
      await deleteWork(id);
      await fetchWorks();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.userMessage || "Failed to delete work" };
    }
  }, [fetchWorks]);

  return { works, isLoading, error, refresh: fetchWorks, create, update, remove, isSubmitting };
}