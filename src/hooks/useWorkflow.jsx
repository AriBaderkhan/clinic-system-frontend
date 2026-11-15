import { useCallback, useEffect, useState } from "react";
import { getWorkflow } from "../api/settingApi";

// The branch's workflow rules (read-only here; Branch Settings changes them)
export default function useWorkflow() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await getWorkflow();
      setData(res?.data || null);
    } catch (err) {
      setError(err.userMessage || "");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, isLoading, error, refresh };
}
