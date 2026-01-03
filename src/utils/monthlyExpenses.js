// src/utils/monthlyExpenses.js

export function calcTotalExpenses(row) {
  const fields = [
    "materials",
    "salary",
    "company_total",
    "electric",
    "rent",
    "tax",
    "marketing",
    "other",
  ];

  return fields.reduce((sum, k) => sum + Number(row?.[k] || 0), 0);
}

export function formatMonth(dateLike) {
  if (!dateLike) return "-";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return String(dateLike);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long" });
}

export function formatMoney(v) {
  const n = Number(v || 0);
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function formatDateTime(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

export function toMonthKey(dateLike) {
  // Always returns "YYYY-MM-01"
  if (!dateLike) return "";

  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) {
    // if already a date string "YYYY-MM-DD..." take first 10
    const s = String(dateLike);
    if (s.length >= 10) {
      const y = s.slice(0, 4);
      const m = s.slice(5, 7);
      return `${y}-${m}-01`;
    }
    return "";
  }

  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}
