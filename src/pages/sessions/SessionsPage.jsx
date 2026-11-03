import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import useSessions from "../../hooks/useSessions";
import SessionDetailsModal from "../../components/sessions/SessionDetailsModal";
import EditSessionModal from "../../components/sessions/EditSessionModal";
import TreatmentPlanPage from "../treatment_plan/TreatmentPlanPage";
import { deleteSession } from "../../api/sessionApi";
import { useSettings } from "../../context/SettingContext";
import ConfirmModal from "../../components/common/ConfirmModal";
import useCan from "../../utils/can";
import PageHeader, { BandTabs, bandTabClass, BAND_TABS } from "../../components/common/PageHeader";

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = [1];
  if (currentPage > 3) pages.push("...");
  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    pages.push(i);
  }
  if (currentPage < totalPages - 2) pages.push("...");
  pages.push(totalPages);
  return pages;
}

export default function Sessions() {
  const { t } = useTranslation();
  const can = useCan();
  const { formatDateTime, formatMoney } = useSettings();
  const [tab, setTab] = useState("sessions");
  const [selectedId, setSelectedId] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [dayFilter, setDayFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { sessions, isLoading, error, refresh, page, setPage, pagination } = useSessions({
    day: dayFilter,
    search: searchTerm,
  });

  const handlePageChange = (newPage) => {
    setPage(newPage);
    const el = document.getElementById("main-scroll");
    if (el) el.scrollTop = 0;
  };

  function openView(id) {
    setSelectedId(id);
  }

  function openEdit(id) {
    setSelectedId(id);
    setIsEditOpen(true);
  }

  function closeEdit() {
    setIsEditOpen(false);
    setSelectedId(null); // otherwise the View modal pops up right after closing Edit
  }

  // Open the confirm modal.
  const handleDelete = (sessionId) => setPendingDeleteId(sessionId);

  // Confirm = actually void the visit.
  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      setDeleting(true);
      await deleteSession(pendingDeleteId);
      await refresh();
      setPendingDeleteId(null);
    } catch (err) {
      toast.error(err.userMessage || t("clin.sess_delete_failed"));
    } finally {
      setDeleting(false);
    }
  };

  const pageNumbers = getPageNumbers(page, pagination.totalPages);
  const showPagination = pagination.totalPages > 1;
  const rowStart = (page - 1) * pagination.limit + 1;
  const rowEnd = Math.min(page * pagination.limit, pagination.total);

  return (
    <div className="w-full space-y-5">
      {/* Tabs (in the band, under the title) */}
      <BandTabs>
        <div className={BAND_TABS}>
          <button type="button" onClick={() => setTab("sessions")} className={bandTabClass(tab === "sessions")}>
            {t("clin.sess_tab_sessions")}
          </button>
          <button type="button" onClick={() => setTab("plans")} className={bandTabClass(tab === "plans")}>
            {t("clin.sess_tab_plans")}
          </button>
        </div>
      </BandTabs>

      {tab === "plans" ? (
        <TreatmentPlanPage />
      ) : (
        <>
      {/* Header */}
      <PageHeader title={t("clin.sess_title")} subtitle={t("clin.sess_subtitle")} />

      {/* Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">

        {/* Filter bar */}
        <div className="mb-4 flex flex-wrap items-end gap-3">

          {/* Search */}
          <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-72">
            <label className="text-sm font-medium text-slate-700">{t("clin.sess_search")}</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("clin.sess_search_ph")}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
            />
          </div>

          {/* Day */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">{t("clin.sess_day")}</label>
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
            >
              <option value="">{t("appt.all")}</option>
              <option value="today">{t("appt.today")}</option>
              <option value="yesterday">{t("appt.yesterday")}</option>
              <option value="last_week">{t("appt.last_week")}</option>
              <option value="last_month">{t("appt.last_month")}</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
            >
              {t("appt.refresh")}
            </button>
            <button
              type="button"
              onClick={() => { setDayFilter(""); setSearchTerm(""); }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {t("appt.clear")}
            </button>
          </div>
        </div>

        {/* Count info */}
        <p className="mb-3 text-xs text-slate-500">
          {isLoading
            ? t("clin.sess_loading")
            : t("appt.count_info", { total: pagination.total, start: pagination.total === 0 ? 0 : rowStart, end: rowEnd })}
        </p>

        {/* Error */}
        {error && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && sessions.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-500">
            {t("clin.sess_empty")}
          </div>
        )}

        {/* Table */}
        {sessions.length > 0 && (
          <div className="-mx-4 overflow-x-auto sm:-mx-5">
            <table className="w-full text-start text-sm">
              <thead className="bg-slate-50">
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 text-start">#</th>
                  <th className="px-4 py-3 text-start">{t("clin.sess_col_patient")}</th>
                  <th className="px-4 py-3 text-start">{t("clin.sess_col_doctor")}</th>
                  <th className="px-4 py-3 text-start">{t("clin.sess_col_finished")}</th>
                  <th className="px-4 py-3 text-start">{t("clin.sess_col_total")}</th>
                  <th className="px-4 py-3 text-start">{t("clin.sess_col_paid")}</th>
                  <th className="px-4 py-3 text-start">{t("clin.sess_col_status")}</th>
                  <th className="px-4 py-3 text-start">{t("clin.sess_col_notes")}</th>
                  <th className="px-4 py-3 text-end">{t("clin.sess_col_actions")}</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, idx) => {
                  const rowNumber = (page - 1) * pagination.limit + idx + 1;
                  return (
                    <tr key={s.session_id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 tabular-nums text-slate-500">{rowNumber}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{s.patient_name}</td>
                      <td className="px-4 py-3 text-slate-700">{s.doctor_name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {formatDateTime(s.appointment_end_time)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-slate-900">
                        {s.has_normal_works === false ? (
                          s.has_plan_works ? (
                            <span className="inline-flex items-center whitespace-nowrap rounded-full border border-purple-100 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">{t("clin.sess_treatment_plan_badge")}</span>
                          ) : (
                            <span className="inline-flex items-center whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">{t("clin.sess_no_works_badge")}</span>
                          )
                        ) : (
                          formatMoney(s.total, s.currency_code)
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-slate-900">
                        {s.has_normal_works === false ? <span className="text-slate-400">—</span> : formatMoney(s.total_paid, s.currency_code)}
                      </td>
                      <td className="px-4 py-3">
                        {s.has_normal_works === false ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <span className={[
                            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                            s.is_paid ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800",
                          ].join(" ")}>
                            {s.is_paid ? t("clin.sess_paid") : t("clin.sess_unpaid")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[220px]">
                        {s.payment_note ? (
                          <span className="block truncate" title={s.payment_note}>
                            {s.payment_note}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => openView(s.session_id)}
                            className="inline-flex items-center rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark"
                          >
                            {t("common.view")}
                          </button>
                          {can("edit_session") && (
                            <button
                              type="button"
                              onClick={() => openEdit(s.session_id)}
                              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              {t("common.edit")}
                            </button>
                          )}
                          {can("delete_session") && (
                            <button
                              type="button"
                              onClick={() => handleDelete(s.session_id)}
                              className="inline-flex items-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              {t("common.delete")}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {showPagination && (
          <div className="mt-4 flex flex-col items-center gap-2 border-t border-slate-100 pt-4">
            <div className="flex flex-wrap items-center justify-center gap-1">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("appt.prev")}
              </button>

              {pageNumbers.map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-xs text-slate-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`min-w-[2rem] rounded-lg border px-3 py-1.5 text-xs font-medium tabular-nums transition ${
                      p === page
                        ? "border-brand bg-brand text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === pagination.totalPages}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("appt.next")}
              </button>
            </div>
            <span className="text-xs text-slate-500">
              {t("clin.sess_showing_of", { start: rowStart, end: rowEnd, total: pagination.total })}
            </span>
          </div>
        )}
      </div>

      {selectedId && !isEditOpen && (
        <SessionDetailsModal
          sessionId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}

      {isEditOpen && selectedId && (
        <EditSessionModal
          sessionId={selectedId}
          onClose={closeEdit}
          onUpdated={() => {
            refresh();
          }}
        />
      )}

      {pendingDeleteId && (
        <ConfirmModal
          danger
          title={t("clin.sess_delete_title")}
          message={t("clin.sess_delete_confirm")}
          confirmLabel={t("common.delete")}
          cancelLabel={t("common.cancel")}
          loading={deleting}
          onConfirm={confirmDelete}
          onClose={() => setPendingDeleteId(null)}
        />
      )}
        </>
      )}
    </div>
  );
}
