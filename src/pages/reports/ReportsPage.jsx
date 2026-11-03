import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import MonthlyExpensesPage from "./MonthlyExpensesPage";
import useMonthlyReportPdf from "../../hooks/useMonthlyReportPdf";
import { useSubscription } from "../../context/SubscriptionContext";
import PageHeader from "../../components/common/PageHeader";

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
    <div className="w-full space-y-5">
      <PageHeader title={t('report.title')} subtitle={t('report.subtitle')} />

      {/* Tabs like Patient Folder */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
          <div className="inline-flex max-w-full flex-wrap rounded-xl border border-slate-200 bg-white p-1">
            <button
              onClick={() => setTab("reports")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === "reports"
                ? "bg-brand text-white"
                : "text-slate-600 hover:bg-slate-50"
                }`}
            >
              {t('report.tab_reports')}
            </button>
            <button
              onClick={() => setTab("expenses")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === "expenses"
                ? "bg-brand text-white"
                : "text-slate-600 hover:bg-slate-50"
                }`}
            >
              {t('report.tab_expenses')}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          {tab === "reports" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-[15px] font-semibold text-slate-900">{t('report.monthly_pdf')}</div>
                  <div className="mt-0.5 text-sm text-slate-500">
                    {t('report.select_then_download')}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex flex-wrap gap-2">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                    <input
                      type="radio"
                      name="reportType"
                      checked={reportType === 'monthly'}
                      onChange={() => setReportType('monthly')}
                    />
                    {t('report.monthly_report')}
                  </label>
                  {canCustomRange && (
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
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
                    <div className="w-full sm:w-auto">
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('report.select_month')}</label>
                      <input
                        type="month"
                        value={monthValue}
                        onChange={(e) => setMonthValue(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="w-full sm:w-auto">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('report.from_date')}</label>
                        <input
                          type="date"
                          value={dateRange.from}
                          onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                        />
                      </div>
                      <div className="w-full sm:w-auto">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('report.to_date')}</label>
                        <input
                          type="date"
                          value={dateRange.to}
                          onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                        />
                      </div>
                    </>
                  )}

                  <button
                    onClick={onDownload}
                    disabled={isLoading || (reportType === 'monthly' ? !monthParam : (!dateRange.from || !dateRange.to))}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
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
                <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
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
