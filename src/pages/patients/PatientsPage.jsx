import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import usePatients from "../../hooks/usePatients";
import { useAuth } from "../../context/AuthContext";
import useCan from "../../utils/can";
import PageHeader from "../../components/common/PageHeader";

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

export default function PatientsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const can = useCan();
  const [searchTerm, setSearchTerm] = useState("");
  const { patients, isLoading, error, refresh, deletePatient, page, setPage, pagination } = usePatients({
    search: searchTerm,
  });

  const navigate = useNavigate();

  const handlePageChange = (newPage) => {
    setPage(newPage);
    const el = document.getElementById("main-scroll");
    if (el) el.scrollTop = 0;
  };

  const handleEdit = (id) => {
    navigate(`/patients/${id}/edit`);
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm(t("patients.delete_confirm"));
    if (!confirm) return;
    const result = await deletePatient(id);
    if (!result.ok) {
      toast.error(result.error || t("patients.delete_failed"));
    }
  };

  const handleRowClick = (id) => {
    navigate(`/patients/${id}`);
  };

  const pageNumbers = getPageNumbers(page, pagination.totalPages);
  const showPagination = pagination.totalPages > 1;
  const rowStart = (page - 1) * pagination.limit + 1;
  const rowEnd = Math.min(page * pagination.limit, pagination.total);

  return (
    <div className="w-full space-y-5">
      <PageHeader
        title={t("patients.title")}
        subtitle={t("patients.subtitle", { clinic: user?.clinic_name || "" })}
        actions={
          can("create_patient") && (
            <button
              type="button"
              onClick={() => navigate(`/patients/add`)}
              className="rounded-xl bg-aqua px-4 py-2.5 text-sm font-bold text-ocean-deep transition hover:brightness-110"
            >
              {t("patients.add_patient")}
            </button>
          )
        }
      />

      {/* Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">

        {/* Filter bar */}
        <div className="mb-4 flex flex-wrap items-end gap-3">

          {/* Search */}
          <div className="w-full min-w-0 sm:w-72">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t("patients.search")}</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("patients.search_ph")}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              {t("patients.refresh")}
            </button>
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {t("patients.clear")}
            </button>
          </div>
        </div>

        {/* Count info */}
        <p className="mb-3 text-xs text-slate-500">
          {isLoading
            ? t("patients.loading")
            : t("patients.count_info", { total: pagination.total, start: pagination.total === 0 ? 0 : rowStart, end: rowEnd })}
        </p>

        {/* Error */}
        {error && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && patients.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-500">
            {t("patients.empty")}
          </div>
        )}

        {/* Table */}
        {patients.length > 0 && (
          <div className="-mx-4 overflow-x-auto sm:-mx-5">
            <table className="w-full text-start text-sm">
              <thead className="bg-slate-50">
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 text-start">#</th>
                  <th className="px-4 py-3 text-start">{t("patients.col_name")}</th>
                  <th className="px-4 py-3 text-start">{t("patients.col_age")}</th>
                  <th className="px-4 py-3 text-start">{t("patients.col_gender")}</th>
                  <th className="px-4 py-3 text-start">{t("patients.col_phone")}</th>
                  <th className="px-4 py-3 text-start">{t("patients.col_address")}</th>
                  <th className="px-4 py-3 text-end">{t("patients.col_actions")}</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p, idx) => {
                  const rowNumber = (page - 1) * pagination.limit + idx + 1;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => handleRowClick(p.id)}
                      className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 tabular-nums text-slate-500">{rowNumber}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-700">{p.age}</td>
                      <td className="px-4 py-3 capitalize text-slate-700">{p.gender}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-700">
                        {[p.phone, ...(p.extra_phones || [])].map((ph) => (
                          <div key={ph} className="whitespace-nowrap">{ph}</div>
                        ))}
                      </td>
                      <td className="max-w-[16rem] break-words px-4 py-3 text-slate-700">{p.address || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {can("update_patient") && (
                            <button
                              type="button"
                              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                              onClick={(e) => { e.stopPropagation(); handleEdit(p.id); }}
                            >
                              {t("common.edit")}
                            </button>
                          )}
                          {can("delete_patient") && (
                            <button
                              type="button"
                              className="inline-flex items-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                              onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
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
                {t("patients.prev")}
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
                {t("patients.next")}
              </button>
            </div>
            <span className="text-xs text-slate-500">
              {t("patients.showing_of", { start: rowStart, end: rowEnd, total: pagination.total })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
