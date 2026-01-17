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
    } catch (err) {
      setError(err.userMessage || "Failed to download PDF");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { download, isLoading, error };
}
