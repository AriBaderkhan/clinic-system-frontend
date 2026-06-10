import { useCallback, useEffect, useState } from "react";
import { getAllDoctors } from "../api/doctorApi";

export default function useDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDoctors = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await getAllDoctors();
      setDoctors(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.userMessage || "Could not load doctors.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  return { doctors, isLoading, error, refresh: fetchDoctors };
}