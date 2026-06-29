import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import useAppointments from "../../hooks/useAppointments";
import AppointmentStatusModal from "../../components/appointments/AppointmentStatusModal";
import AppointmentDetailsModal from "../../components/appointments/AppointmentDetailsModal";
import { deleteAppointment } from "../../api/appointmentApi";
import CompleteAppointmentModal from "../../components/appointments/CompleteAppointmentModal";
import { useSettings } from "../../context/SettingContext";

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

export default function AppointmentPage() {
  const { t } = useTranslation();
  const { formatDateTime } = useSettings();
  const navigate = useNavigate();
  const role = localStorage.getItem("role") || "reception";
  const prefix = (role === "branch_manager" || role === "tenant_manager") ? "/branch" : "/reception";

  const [dayFilter, setDayFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { appointments, isLoading, error, refresh, page, setPage, pagination, isSearching } = useAppointments({
    day: dayFilter,
    type: typeFilter,
    search: searchTerm,
  });

  const [selectedForStatus, setSelectedForStatus] = useState(null);
  const [selectedForComplete, setSelectedForComplete] = useState(null);
  const [selectedDetailsId, setSelectedDetailsId] = useState(null);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    const el = document.getElementById("main-scroll");
    if (el) el.scrollTop = 0;
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(t("appt.delete_confirm"));
    if (!confirmDelete) return;
    try {
      await deleteAppointment(id);
      await refresh();
    } catch (err) {
      toast.error(err.userMessage || t("appt.delete_failed"));
    }
  };

  const handleEdit = (id) => {
    navigate(`${prefix}/appointments/${id}/edit`);
  };

  const pageNumbers = getPageNumbers(page, pagination.totalPages);
  const showPagination = pagination.totalPages > 1;
  const rowStart = (page - 1) * pagination.limit + 1;
  const rowEnd = Math.min(page * pagination.limit, pagination.total);

  return (
    <div className="space-y-6">
      {selectedForStatus && (
        <AppointmentStatusModal
          appointment={selectedForStatus}
          onClose={() => setSelectedForStatus(null)}
          onUpdated={refresh}
        />
      )}

      {selectedDetailsId && (
        <AppointmentDetailsModal
          appointmentId={selectedDetailsId}
          onClose={() => setSelectedDetailsId(null)}
        />
      )}

      {selectedForComplete && (
        <CompleteAppointmentModal
          appointment={selectedForComplete}
          onClose={() => setSelectedForComplete(null)}
          onCompleted={refresh}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{t("appt.title")}</h1>
          <p className="text-xs text-slate-500">
            {t("appt.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`${prefix}/appointments/add`)}
          className="rounded-lg bg-[#015478] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#013d58]"
        >
          {t("appt.add")}
        </button>
      </div>

      {/* Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">

        {/* Filters bar */}
        <div className="mb-5 rounded-2xl bg-[#015478]/5 border border-[#015478]/10 px-4 py-4 flex flex-wrap items-end gap-4">

          {/* Search */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-[#015478]">{t("appt.search")}</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("appt.search_ph")}
              className="rounded-xl border border-[#015478]/20 bg-white px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#015478] focus:outline-none focus:ring-2 focus:ring-[#015478]/20"
            />
          </div>

          {/* Day */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#015478]">{t("appt.day")}</label>
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="rounded-xl border border-[#015478]/20 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:border-[#015478] focus:outline-none focus:ring-2 focus:ring-[#015478]/20"
            >
              <option value="">{t("appt.all")}</option>
              <option value="today">{t("appt.today")}</option>
              <option value="yesterday">{t("appt.yesterday")}</option>
              <option value="last_week">{t("appt.last_week")}</option>
              <option value="last_month">{t("appt.last_month")}</option>
            </select>
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#015478]">{t("appt.type")}</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-[#015478]/20 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:border-[#015478] focus:outline-none focus:ring-2 focus:ring-[#015478]/20"
            >
              <option value="">{t("appt.all")}</option>
              <option value="normal">{t("appt.type_normal")}</option>
              <option value="urgent">{t("appt.type_urgent")}</option>
              <option value="walk_in">{t("appt.type_walk_in")}</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={refresh}
              className="rounded-xl bg-[#015478] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#013d58] transition-colors"
            >
              {t("appt.refresh")}
            </button>
            <button
              type="button"
              onClick={() => { setDayFilter(""); setTypeFilter(""); setSearchTerm(""); }}
              className="rounded-xl border border-[#015478]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#015478] hover:bg-[#015478]/5 transition-colors"
            >
              {t("appt.clear")}
            </button>
          </div>
        </div>

        {/* Count info */}
        <p className="mb-3 text-xs text-slate-400">
          {isLoading
            ? t("appt.loading")
            : t("appt.count_info", { total: pagination.total, start: pagination.total === 0 ? 0 : rowStart, end: rowEnd })}
        </p>

        {/* Error */}
        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && appointments.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
            {t("appt.empty")}
          </div>
        )}

        {/* Table */}
        {appointments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">{t("appt.col_patient_name")}</th>
                  <th className="px-3 py-2 font-medium">{t("appt.col_patient_phone")}</th>
                  <th className="px-3 py-2 font-medium">{t("appt.col_doctor")}</th>
                  <th className="px-3 py-2 font-medium">{t("appt.col_datetime")}</th>
                  <th className="px-3 py-2 font-medium">{t("appt.col_type")}</th>
                  <th className="px-3 py-2 font-medium">{t("appt.col_status")}</th>
                  <th className="px-3 py-2 font-medium text-end">{t("appt.col_actions")}</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a, idx) => {
                  const id = a.id ?? a.appointment_id;
                  const rowNumber = (page - 1) * pagination.limit + idx + 1;

                  return (
                    <tr
                      key={id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-3 py-2 text-slate-800">{rowNumber}</td>
                      <td className="px-3 py-2 text-slate-800">{a.patient_name}</td>
                      <td className="px-3 py-2 text-slate-700">{a.patient_phone}</td>
                      <td className="px-3 py-2 text-slate-700 capitalize">{a.doctor_name}</td>
                      <td className="px-3 py-2 text-slate-700">
                        {formatDateTime(a.scheduled_start)}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {a.appointment_type}
                        {a.is_walk_in && (
                          <span className="ms-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                            {t("appt.walk_in_badge")}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            if (a.status === "in_progress") setSelectedForComplete(a);
                            else setSelectedForStatus(a);
                          }}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] capitalize text-slate-700 hover:bg-slate-100"
                        >
                          {a.status}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setSelectedDetailsId(id)}
                            className="rounded-md border border-slate-200 bg-[#015478] px-3 py-1 text-[11px] text-slate-100 hover:bg-[#013d58]"
                          >
                            {t("common.view")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(id)}
                            className="rounded-md border border-slate-200 bg-yellow-600 px-3 py-1 text-[11px] text-slate-100 hover:bg-yellow-900"
                          >
                            {t("common.edit")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(id)}
                            className="rounded-md border border-red-200 bg-red-600 px-3 py-1 text-[11px] text-slate-100 hover:bg-red-900"
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
                {t("appt.prev")}
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
                        ? "border-[#015478] bg-[#015478] text-white"
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
                {t("appt.next")}
              </button>
            </div>
            <span className="text-[11px] text-slate-400">
              {t("appt.showing_of", { start: rowStart, end: rowEnd, total: pagination.total })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
