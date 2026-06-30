import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { downloadMyDoctorReportPdf } from "../../api/doctorApi";
import { useSubscription } from "../../context/SubscriptionContext";

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{t("docrep.title")}</h1>
        <p className="text-xs text-slate-500">{t("docrep.subtitle")}</p>
      </div>

      {/* Period selector + download (same as the general report) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex gap-4 mb-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" name="docReportType" checked={reportType === "monthly"} onChange={() => setReportType("monthly")} />
            {t("report.monthly_report")}
          </label>
          {canCustomRange && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="docReportType" checked={reportType === "custom"} onChange={() => setReportType("custom")} />
              {t("report.custom_range")}
            </label>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          {reportType === "monthly" ? (
            <div className="space-y-1">
              <label className="block text-xs text-slate-600">{t("report.select_month")}</label>
              <input type="month" value={monthValue} onChange={(e) => setMonthValue(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300" />
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label className="block text-xs text-slate-600">{t("report.from_date")}</label>
                <input type="date" value={dateRange.from} onChange={(e) => setDateRange((p) => ({ ...p, from: e.target.value }))}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-slate-600">{t("report.to_date")}</label>
                <input type="date" value={dateRange.to} onChange={(e) => setDateRange((p) => ({ ...p, to: e.target.value }))}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300" />
              </div>
            </>
          )}

          <button onClick={onDownload} disabled={!ready || downloading}
            className="rounded-lg bg-[#015478] px-4 py-2 text-sm font-medium text-white hover:bg-[#013d58] disabled:opacity-60 mb-[1px]">
            {downloading ? t("report.downloading") : t("report.download_pdf")}
          </button>
        </div>

        <div className="mt-3 text-xs text-slate-500">
          {reportType === "monthly"
            ? t("report.selected", { month: monthLabel(monthValue) })
            : t("report.selected_range", { from: dateRange.from, to: dateRange.to })}
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
      </div>
    </div>
  );
}
