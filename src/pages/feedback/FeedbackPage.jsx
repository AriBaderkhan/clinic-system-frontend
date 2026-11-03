import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getFeedbackAppointments } from "../../api/feedbackApi";
import FeedbackSendModal from "../../components/feedback/FeedbackSendModal";
import PageHeader from "../../components/common/PageHeader";

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
    <div className="w-full space-y-5">
      <PageHeader title={t("feedback.page_title")} subtitle={t("feedback.page_subtitle")} />

      {loading && <div className="rounded-2xl border border-slate-200 bg-white py-10 text-center text-sm text-slate-500 shadow-card">{t("feedback.loading")}</div>}
      {error && !loading && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-card">{error}</div>
      )}

      {!loading && !error && list.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-slate-500 shadow-card">
          {t("feedback.empty")}
        </div>
      )}

      {!loading && !error && list.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t("feedback.col_patient")}</th>
                <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t("feedback.col_phone")}</th>
                <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t("feedback.col_last_visit")}</th>
                <th className="whitespace-nowrap px-4 py-3 text-end text-xs font-semibold uppercase tracking-wide text-slate-500">{t("feedback.col_action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((r) => (
                <tr key={r.patient_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{r.patient_name}</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-700">
                    {r.phone_raw}
                    {!r.phone_valid && (
                      <span className="ms-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                        {t("feedback.check_number")}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-700">{fmtWhen(r.latest_start)}</td>
                  <td className="px-4 py-3 text-end">
                    <button
                      onClick={() => setActive(r)}
                      className="inline-flex items-center justify-center rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark"
                    >
                      {t("feedback.prepare")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {showPagination && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-wrap items-center justify-center gap-1">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("patients.prev")}
            </button>
            {pageNumbers.map((p, i) =>
              p === "..." ? (
                <span key={`e-${i}`} className="px-1 text-xs text-slate-400">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`inline-flex min-w-[2rem] items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-semibold tabular-nums transition ${
                    p === page ? "border-brand bg-brand text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === pagination.totalPages}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
