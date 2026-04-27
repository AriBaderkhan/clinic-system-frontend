import { useState } from "react";
import { downloadMonthlyReportPdf } from "../api/reportsApi";

export default function useMonthlyReportPdf() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const download = async ({ month, from, to }) => {
    setError("");
    setIsLoading(true);
    try {
      return await downloadMonthlyReportPdf({ month, from, to });
    } catch (err) {
      setError(err.userMessage || "Failed to download PDF");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { download, isLoading, error };
}
