import api from "./api";

// GET /api/reports/monthly/pdf?month=2025-12-01  -> returns PDF buffer
export async function downloadMonthlyReportPdf({ month, from, to }) {
  // IMPORTANT: responseType = "blob" so Axios treats it as file
  const res = await api.get("/api/reports/monthly/pdf", {
    params: { month, from, to },
    responseType: "blob",
  });

  // try get filename from header (if backend sends it)
  const cd = res.headers?.["content-disposition"] || "";
  const match = cd.match(/filename="?([^"]+)"?/i);

  let fallback = "Crown-Clinic-Monthly-Report.pdf";
  if (month) fallback = `Crown-Clinic-Monthly-Report-${month}.pdf`;
  if (from && to) fallback = `Crown-Clinic-Report-${from}-to-${to}.pdf`;

  const filename = match?.[1] || fallback;

  return { blob: res.data, filename };
}
