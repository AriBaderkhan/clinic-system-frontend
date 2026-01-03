import { useMemo, useState } from "react";
import MonthlyExpensesPage from "./MonthlyExpensesPage";
import useMonthlyReportPdf from "../../hooks/useMonthlyReportPdf";

function toMonthParam(value) {
  // value is "2025-12" from <input type="month" />
  if (!value) return "";
  return `${value}-01`;
}

function monthLabel(value) {
  if (!value) return "";
  const [y, m] = value.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export default function ReportsPage() {
  const [tab, setTab] = useState("reports"); // reports | expenses
  const [monthValue, setMonthValue] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  });

  const { download, isLoading, error } = useMonthlyReportPdf();

  const monthParam = useMemo(() => toMonthParam(monthValue), [monthValue]);

  const onDownload = async () => {
    const { blob, filename } = await download({ month: monthParam });

    // force download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Reports</h1>
        <p className="text-xs text-slate-500">
          Monthly clinic report PDF + monthly expenses management.
        </p>
      </div>

      {/* Tabs like Patient Folder */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setTab("reports")}
              className={`px-4 py-2 text-sm rounded-lg ${
                tab === "reports"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-700 hover:bg-white"
              }`}
            >
              Reports
            </button>
            <button
              onClick={() => setTab("expenses")}
              className={`px-4 py-2 text-sm rounded-lg ${
                tab === "expenses"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-700 hover:bg-white"
              }`}
            >
              Expenses
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {tab === "reports" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">Monthly Report PDF</div>
                  <div className="text-xs text-slate-500">
                    Select month then download the PDF.
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="space-y-1">
                    <label className="block text-xs text-slate-600">Month</label>
                    <input
                      type="month"
                      value={monthValue}
                      onChange={(e) => setMonthValue(e.target.value)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300"
                    />
                  </div>

                  <button
                    onClick={onDownload}
                    disabled={isLoading || !monthParam}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {isLoading ? "Downloading..." : "Download PDF"}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-sm text-slate-700">
                  Selected: <span className="font-semibold">{monthLabel(monthValue)}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  API: <span className="font-mono">/api/reports/monthly/pdf?month={monthParam}</span>
                </div>
              </div>

              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
            </div>
          ) : (
            <MonthlyExpensesPage />
          )}
        </div>
      </div>
    </div>
  );
}
