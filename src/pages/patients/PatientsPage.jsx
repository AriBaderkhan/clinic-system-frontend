import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import usePatients from "../../hooks/usePatients";

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
  const [searchTerm, setSearchTerm] = useState("");
  const { patients, isLoading, error, refresh, deletePatient, page, setPage, pagination } = usePatients({
    search: searchTerm,
  });

  const navigate = useNavigate();
  const role = localStorage.getItem("role") || "reception";
  const prefix = (role === "branch_manager" || role === "tenant_manager") ? "/branch" : "/reception";

  const handlePageChange = (newPage) => {
    setPage(newPage);
    const el = document.getElementById("main-scroll");
    if (el) el.scrollTop = 0;
  };

  const handleEdit = (id) => {
    navigate(`${prefix}/patients/${id}/edit`);
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
    navigate(`${prefix}/patients/${id}`);
  };

  const pageNumbers = getPageNumbers(page, pagination.totalPages);
  const showPagination = pagination.totalPages > 1;
  const rowStart = (page - 1) * pagination.limit + 1;
  const rowEnd = Math.min(page * pagination.limit, pagination.total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{t("patients.title")}</h1>
          <p className="text-xs text-slate-500">
            {t("patients.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`${prefix}/patients/add`)}
          className="rounded-lg bg-[#0E6E75] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0A565C]"
        >
          {t("patients.add_patient")}
        </button>
      </div>

      {/* Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">

        {/* Filter bar */}
        <div className="mb-5 rounded-2xl bg-[#0E6E75]/5 border border-[#0E6E75]/10 px-4 py-4 flex flex-wrap items-end gap-4">

          {/* Search */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-[#0E6E75]">{t("patients.search")}</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("patients.search_ph")}
              className="rounded-xl border border-[#0E6E75]/20 bg-white px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0E6E75] focus:outline-none focus:ring-2 focus:ring-[#0E6E75]/20"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={refresh}
              className="rounded-xl bg-[#0E6E75] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0A565C] transition-colors"
            >
              {t("patients.refresh")}
            </button>
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="rounded-xl border border-[#0E6E75]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#0E6E75] hover:bg-[#0E6E75]/5 transition-colors"
            >
              {t("patients.clear")}
            </button>
          </div>
        </div>

        {/* Count info */}
        <p className="mb-3 text-xs text-slate-400">
          {isLoading
            ? t("patients.loading")
            : t("patients.count_info", { total: pagination.total, start: pagination.total === 0 ? 0 : rowStart, end: rowEnd })}
        </p>

        {/* Error */}
        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && patients.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
            {t("patients.empty")}
          </div>
        )}

        {/* Table */}
        {patients.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">{t("patients.col_name")}</th>
                  <th className="px-3 py-2 font-medium">{t("patients.col_age")}</th>
                  <th className="px-3 py-2 font-medium">{t("patients.col_gender")}</th>
                  <th className="px-3 py-2 font-medium">{t("patients.col_phone")}</th>
                  <th className="px-3 py-2 font-medium">{t("patients.col_address")}</th>
                  <th className="px-3 py-2 font-medium text-end">{t("patients.col_actions")}</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p, idx) => {
                  const rowNumber = (page - 1) * pagination.limit + idx + 1;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => handleRowClick(p.id)}
                      className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-3 py-2 text-slate-800">{rowNumber}</td>
                      <td className="px-3 py-2 text-slate-800">{p.name}</td>
                      <td className="px-3 py-2 text-slate-700">{p.age}</td>
                      <td className="px-3 py-2 text-slate-700 capitalize">{p.gender}</td>
                      <td className="px-3 py-2 text-slate-700">{p.phone}</td>
                      <td className="px-3 py-2 text-slate-700">{p.address || "-"}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            type="button"
                            className="rounded-md border border-slate-200 bg-amber-600 px-3 py-1 text-[11px] text-white hover:bg-amber-700"
                            onClick={(e) => { e.stopPropagation(); handleEdit(p.id); }}
                          >
                            {t("common.edit")}
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-red-200 bg-red-600 px-3 py-1 text-[11px] text-white hover:bg-red-700"
                            onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                          >
                            {t("common.delete")}
                          </button>
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
                className="rounded-md border border-slate-200 px-3 py-1.5 text-[11px] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("patients.prev")}
              </button>

              {pageNumbers.map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-[11px] text-slate-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`rounded-md border px-3 py-1.5 text-[11px] transition-colors ${
                      p === page
                        ? "border-[#0E6E75] bg-[#0E6E75] text-white"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
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
            <span className="text-[11px] text-slate-400">
              {t("patients.showing_of", { start: rowStart, end: rowEnd, total: pagination.total })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
