import { useState } from "react";
import { downloadMonthlyReportPdf } from "../api/reportsApi";

export default function useMonthlyReportPdf() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const download = async ({ month }) => {
    setError("");
    setIsLoading(true);
    try {
      return await downloadMonthlyReportPdf({ month });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to download PDF");
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  return { download, isLoading, error };
}
