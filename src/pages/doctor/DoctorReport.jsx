import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { downloadMyDoctorReportPdf } from "../../api/doctorApi";
import { useSubscription } from "../../context/SubscriptionContext";
import PageHeader from "../../components/common/PageHeader";

function toMonthParam(value) {
  if (!value) return "";
  return `${value}-01`;
}

function monthLabel(value) {
  if (!value) return "";
  const [y, m] = value.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export default function DoctorReport() {
  const { t } = useTranslation();
  const { hasFeature } = useSubscription();
  const canCustomRange = hasFeature("custom_report");

  const [monthValue, setMonthValue] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [reportType, setReportType] = useState("monthly"); // monthly | custom
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const monthParam = useMemo(() => toMonthParam(monthValue), [monthValue]);

  const ready =
    reportType === "monthly" ? !!monthParam : !!dateRange.from && !!dateRange.to;

  const onDownload = async () => {
    setError("");
    setDownloading(true);
    try {
      const params =
        reportType === "monthly"
          ? { month: monthParam }
          : { from: dateRange.from, to: dateRange.to };
      const { blob, filename } = await downloadMyDoctorReportPdf(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.userMessage || t("docrep.failed_pdf"));
    } finally {
      setDownloading(false);
    }
  };

  const RADIO = "inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50";
  const INPUT = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 sm:w-56";

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <PageHeader title={t("docrep.title")} subtitle={t("docrep.subtitle")} />

      {/* Period selector + download (same as the general report) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
        <div className="mb-4 inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1">
          <label className={RADIO}>
            <input type="radio" name="docReportType" className="accent-brand" checked={reportType === "monthly"} onChange={() => setReportType("monthly")} />
            {t("report.monthly_report")}
          </label>
          {canCustomRange && (
            <label className={RADIO}>
              <input type="radio" name="docReportType" className="accent-brand" checked={reportType === "custom"} onChange={() => setReportType("custom")} />
              {t("report.custom_range")}
            </label>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          {reportType === "monthly" ? (
            <div className="w-full sm:w-auto">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">{t("report.select_month")}</label>
              <input type="month" value={monthValue} onChange={(e) => setMonthValue(e.target.value)}
                className={INPUT} />
            </div>
          ) : (
            <>
              <div className="w-full sm:w-auto">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">{t("report.from_date")}</label>
                <input type="date" value={dateRange.from} onChange={(e) => setDateRange((p) => ({ ...p, from: e.target.value }))}
                  className={INPUT} />
              </div>
              <div className="w-full sm:w-auto">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">{t("report.to_date")}</label>
                <input type="date" value={dateRange.to} onChange={(e) => setDateRange((p) => ({ ...p, to: e.target.value }))}
                  className={INPUT} />
              </div>
            </>
          )}

          <button onClick={onDownload} disabled={!ready || downloading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
            {downloading ? t("report.downloading") : t("report.download_pdf")}
          </button>
        </div>

        <div className="mt-4 text-sm text-slate-500">
          {reportType === "monthly"
            ? t("report.selected", { month: monthLabel(monthValue) })
            : t("report.selected_range", { from: dateRange.from, to: dateRange.to })}
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
      </div>
    </div>
  );
}
