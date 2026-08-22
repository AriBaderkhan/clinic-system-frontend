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

// ---- Insights Assistant (tenant_manager, Pro feature) --------------------

// The question menu. Each entry: { id, category, label, type, unit, supportsCompare }.
export async function getInsightsCatalog() {
  const res = await api.get("/api/reports/insights/catalog");
  return res.data?.data || [];
}

// Run one question. params: { month | from,to, compare, compareMonth, compareFrom, compareTo }
export async function getInsight(metricId, params = {}) {
  const res = await api.get(`/api/reports/insights/${metricId}`, { params });
  return res.data?.data || null;
}

// Bounds for the Excel month picker: { earliest_month, latest_month } as 'YYYY-MM'.
export async function getInsightsMeta() {
  const res = await api.get("/api/reports/insights/meta");
  return res.data?.data || null;
}

// Download the styled Insights Excel for ONE month ('YYYY-MM'). Returns { blob, filename }.
export async function downloadInsightsExcel(month) {
  const res = await api.get("/api/reports/insights/excel", {
    params: { month },
    responseType: "blob",
  });
  const cd = res.headers?.["content-disposition"] || "";
  const match = cd.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] || `Insights-${month}.xlsx`;
  return { blob: res.data, filename };
}
