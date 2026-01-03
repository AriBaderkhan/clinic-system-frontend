import api from "./api";

// GET /api/reports/monthly/pdf?month=2025-12-01  -> returns PDF buffer
export async function downloadMonthlyReportPdf({ month }) {
  // IMPORTANT: responseType = "blob" so Axios treats it as file
  const res = await api.get("/api/reports/monthly/pdf", {
    params: { month },
    responseType: "blob",
  });

  // try get filename from header (if backend sends it)
  const cd = res.headers?.["content-disposition"] || "";
  const match = cd.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] || `Crown-Clinic-Monthly-Report-${month}.pdf`;

  return { blob: res.data, filename };
}
