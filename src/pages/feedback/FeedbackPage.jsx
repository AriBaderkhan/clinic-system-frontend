import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getFeedbackAppointments } from "../../api/feedbackApi";
import FeedbackSendModal from "../../components/feedback/FeedbackSendModal";

const LIMIT = 20;

// Show the appointment time in the clinic's timezone (Iraq, UTC+3).
const fmtWhen = (iso) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Baghdad",
    weekday: "short", day: "2-digit", month: "short",
    hour: "numeric", minute: "2-digit", hour12: true,
  }).format(new Date(iso));

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = [1];
  if (currentPage > 3) pages.push("...");
  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
  if (currentPage < totalPages - 2) pages.push("...");
  pages.push(totalPages);
  return pages;
}

export default function FeedbackPage() {
  const { t } = useTranslation();
  const [list, setList] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: LIMIT, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState(null); // patient being prepared

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getFeedbackAppointments(page, LIMIT);
      setList(res.data || []);
      if (res.pagination) setPagination(res.pagination);
    } catch (err) {
      setError(err.userMessage || t("feedback.load_failed"));
    } finally {
      setLoading(false);
    }
  }, [page, t]);

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  // remove the row after send OR skip (stays gone after refresh too)
  const handleDone = (item) => {
    setList((prev) => prev.filter((r) => r.patient_id !== item.patient_id));
    setActive(null);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    const el = document.getElementById("main-scroll");
    if (el) el.scrollTop = 0;
  };

  const pageNumbers = getPageNumbers(page, pagination.totalPages);
  const showPagination = pagination.totalPages > 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t("feedback.page_title")}
        </h1>
        <p className="text-xs text-slate-500">{t("feedback.page_subtitle")}</p>
      </div>

      {loading && <div className="py-10 text-center text-slate-500">{t("feedback.loading")}</div>}
      {error && !loading && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!loading && !error && list.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
          {t("feedback.empty")}
        </div>
      )}

      {!loading && !error && list.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:bg-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-700/40">
              <tr>
                <th className="px-4 py-3">{t("feedback.col_patient")}</th>
                <th className="px-4 py-3">{t("feedback.col_phone")}</th>
                <th className="px-4 py-3">{t("feedback.col_last_visit")}</th>
                <th className="px-4 py-3 text-end">{t("feedback.col_action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {list.map((r) => (
                <tr key={r.patient_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{r.patient_name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {r.phone_raw}
                    {!r.phone_valid && (
                      <span className="ms-2 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-700">
                        {t("feedback.check_number")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fmtWhen(r.latest_start)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setActive(r)}
                      className="rounded-lg bg-[#0E6E75] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#0A565C]"
                    >
                      {t("feedback.prepare")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {showPagination && (
        <div className="mt-2 flex flex-col items-center gap-2">
          <div className="flex flex-wrap items-center justify-center gap-1">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-[11px] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("patients.prev")}
            </button>
            {pageNumbers.map((p, i) =>
              p === "..." ? (
                <span key={`e-${i}`} className="px-1 text-[11px] text-slate-400">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`rounded-md border px-3 py-1.5 text-[11px] transition-colors ${
                    p === page ? "border-[#0E6E75] bg-[#0E6E75] text-white" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === pagination.totalPages}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-[11px] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("patients.next")}
            </button>
          </div>
        </div>
      )}

      {active && (
        <FeedbackSendModal
          item={active}
          source="appointment"
          onDone={handleDone}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}
