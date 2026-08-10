import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import MonthlyExpensesPage from "./MonthlyExpensesPage";
import useMonthlyReportPdf from "../../hooks/useMonthlyReportPdf";
import { useSubscription } from "../../context/SubscriptionContext";

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
  const { t } = useTranslation();
  const [tab, setTab] = useState("reports"); // reports | expenses
  const [monthValue, setMonthValue] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  });

  const [reportType, setReportType] = useState('monthly'); // 'monthly' | 'custom'
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const { hasFeature } = useSubscription();
  const canCustomRange = hasFeature('custom_report');

  const { download, isLoading, error } = useMonthlyReportPdf();

  const monthParam = useMemo(() => toMonthParam(monthValue), [monthValue]);

  const onDownload = async () => {
    let params = {};
    if (reportType === 'monthly') {
      params = { month: monthParam };
    } else {
      params = { from: dateRange.from, to: dateRange.to };
    }

    const { blob, filename } = await download(params);

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
        <h1 className="text-lg font-semibold text-slate-900">{t('report.title')}</h1>
        <p className="text-xs text-slate-500">
          {t('report.subtitle')}
        </p>
      </div>

      {/* Tabs like Patient Folder */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setTab("reports")}
              className={`px-4 py-2 text-sm rounded-lg ${tab === "reports"
                ? "bg-[#0E6E75] text-white"
                : "text-slate-700 hover:bg-white"
                }`}
            >
              {t('report.tab_reports')}
            </button>
            <button
              onClick={() => setTab("expenses")}
              className={`px-4 py-2 text-sm rounded-lg ${tab === "expenses"
                ? "bg-[#0E6E75] text-white"
                : "text-slate-700 hover:bg-white"
                }`}
            >
              {t('report.tab_expenses')}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {tab === "reports" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">{t('report.monthly_pdf')}</div>
                  <div className="text-xs text-slate-500">
                    {t('report.select_then_download')}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 mb-4">
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="reportType"
                      checked={reportType === 'monthly'}
                      onChange={() => setReportType('monthly')}
                    />
                    {t('report.monthly_report')}
                  </label>
                  {canCustomRange && (
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="reportType"
                        checked={reportType === 'custom'}
                        onChange={() => setReportType('custom')}
                      />
                      {t('report.custom_range')}
                    </label>
                  )}
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  {reportType === 'monthly' ? (
                    <div className="space-y-1">
                      <label className="block text-xs text-slate-600">{t('report.select_month')}</label>
                      <input
                        type="month"
                        value={monthValue}
                        onChange={(e) => setMonthValue(e.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <label className="block text-xs text-slate-600">{t('report.from_date')}</label>
                        <input
                          type="date"
                          value={dateRange.from}
                          onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs text-slate-600">{t('report.to_date')}</label>
                        <input
                          type="date"
                          value={dateRange.to}
                          onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300"
                        />
                      </div>
                    </>
                  )}

                  <button
                    onClick={onDownload}
                    disabled={isLoading || (reportType === 'monthly' ? !monthParam : (!dateRange.from || !dateRange.to))}
                    className="rounded-lg bg-[#0E6E75] px-4 py-2 text-sm font-medium text-white hover:bg-[#0A565C] disabled:opacity-60 mb-[1px]"
                  >
                    {isLoading ? t('report.downloading') : t('report.download_pdf')}
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-500">
                {reportType === 'monthly'
                  ? t('report.selected', { month: monthLabel(monthValue) })
                  : t('report.selected_range', { from: dateRange.from, to: dateRange.to })
                }
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
