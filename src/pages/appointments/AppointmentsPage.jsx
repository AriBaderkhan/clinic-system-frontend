import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import useAppointments from "../../hooks/useAppointments";
import useFloorFilter from "../../hooks/useFloorFilter";
import FloorFilter from "../../components/floors/FloorFilter";
import AppointmentStatusModal from "../../components/appointments/AppointmentStatusModal";
import AppointmentDetailsModal from "../../components/appointments/AppointmentDetailsModal";
import { deleteAppointment } from "../../api/appointmentApi";
import CompleteAppointmentModal from "../../components/appointments/CompleteAppointmentModal";
import { useSettings } from "../../context/SettingContext";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useAuth } from "../../context/AuthContext";
import useCan from "../../utils/can";
import PageHeader from "../../components/common/PageHeader";

// status pill tint (look only)
const STATUS_CHIP = {
  completed: "border-green-100 bg-green-50 text-green-700",
  scheduled: "border-sky-100 bg-sky-50 text-sky-700",
  checked_in: "border-amber-100 bg-amber-50 text-amber-800",
  in_progress: "border-brand/20 bg-brand/10 text-brand",
  cancelled: "border-red-100 bg-red-50 text-red-600",
  no_show: "border-slate-200 bg-slate-100 text-slate-500",
};

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
  const { user } = useAuth();
  const can = useCan();
  const navigate = useNavigate();

  const [dayFilter, setDayFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const floor = useFloorFilter(); // starts on my floor; hidden with one floor

  const { appointments, isLoading, error, refresh, page, setPage, pagination, isSearching } = useAppointments({
    day: dayFilter,
    type: typeFilter,
    search: searchTerm,
    floor_id: floor.floorId,
  });

  const [selectedForStatus, setSelectedForStatus] = useState(null);
  const [selectedForComplete, setSelectedForComplete] = useState(null);
  const [selectedDetailsId, setSelectedDetailsId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    const el = document.getElementById("main-scroll");
    if (el) el.scrollTop = 0;
  };

  const handleDelete = (id) => setPendingDeleteId(id);

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      setDeleting(true);
      await deleteAppointment(pendingDeleteId);
      await refresh();
      setPendingDeleteId(null);
    } catch (err) {
      toast.error(err.userMessage || t("appt.delete_failed"));
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (id) => {
    navigate(`/appointments/${id}/edit`);
  };

  const pageNumbers = getPageNumbers(page, pagination.totalPages);
  const showPagination = pagination.totalPages > 1;
  const rowStart = (page - 1) * pagination.limit + 1;
  const rowEnd = Math.min(page * pagination.limit, pagination.total);

  return (
    <div className="w-full space-y-5">
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

      {pendingDeleteId && (
        <ConfirmModal
          danger
          title={t("appt.delete_title")}
          message={t("appt.delete_confirm")}
          confirmLabel={t("common.delete")}
          cancelLabel={t("common.cancel")}
          loading={deleting}
          onConfirm={confirmDelete}
          onClose={() => setPendingDeleteId(null)}
        />
      )}

      {/* Header */}
      <PageHeader
        title={t("appt.title")}
        subtitle={t("appt.subtitle", { clinic: user?.clinic_name || "" })}
        actions={can("create_appointment") ? (
          <button
            type="button"
            onClick={() => navigate(`/appointments/add`)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-aqua px-4 py-2.5 text-sm font-bold text-ocean-deep transition hover:brightness-110"
          >
            {t("appt.add")}
          </button>
        ) : null}
      />

      {/* Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">

        {/* Filters bar */}
        <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">

          {/* Search */}
          <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-72 sm:flex-1">
            <label className="block text-sm font-medium text-slate-700">{t("appt.search")}</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("appt.search_ph")}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
            />
          </div>

          {/* Day */}
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-medium text-slate-700">{t("appt.day")}</label>
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
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
            <label className="block text-sm font-medium text-slate-700">{t("appt.type")}</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
            >
              <option value="">{t("appt.all")}</option>
              <option value="normal">{t("appt.type_normal")}</option>
              <option value="urgent">{t("appt.type_urgent")}</option>
              <option value="walk_in">{t("appt.type_walk_in")}</option>
            </select>
          </div>

          {/* Floor */}
          <FloorFilter floors={floor.floors} value={floor.floorId} onChange={floor.setFloorId} show={floor.show} />

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              {t("appt.refresh")}
            </button>
            <button
              type="button"
              onClick={() => { setDayFilter(""); setTypeFilter(""); setSearchTerm(""); }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {t("appt.clear")}
            </button>
          </div>
        </div>

        {/* Count info */}
        <p className="mb-3 text-xs font-medium text-slate-500">
          {isLoading
            ? t("appt.loading")
            : t("appt.count_info", { total: pagination.total, start: pagination.total === 0 ? 0 : rowStart, end: rowEnd })}
        </p>

        {/* Error */}
        {error && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && appointments.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            {t("appt.empty")}
          </div>
        )}

        {/* Table */}
        {appointments.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-start text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">#</th>
                  <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t("appt.col_patient_name")}</th>
                  <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t("appt.col_patient_phone")}</th>
                  <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t("appt.col_doctor")}</th>
                  <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t("appt.col_datetime")}</th>
                  <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t("appt.col_type")}</th>
                  <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t("appt.col_status")}</th>
                  <th className="whitespace-nowrap px-4 py-3 text-end text-xs font-semibold uppercase tracking-wide text-slate-500">{t("appt.col_actions")}</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a, idx) => {
                  const id = a.id ?? a.appointment_id;
                  const rowNumber = (page - 1) * pagination.limit + idx + 1;

                  return (
                    <tr
                      key={id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 tabular-nums text-slate-500">{rowNumber}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{a.patient_name}</td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-700">{a.patient_phone}</td>
                      <td className="px-4 py-3 capitalize text-slate-700">{a.doctor_name}</td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-700">
                        {formatDateTime(a.scheduled_start)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {a.appointment_type}
                        {a.is_walk_in && (
                          <span className="ms-1.5 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            {t("appt.walk_in_badge")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            if (a.status === "in_progress") setSelectedForComplete(a);
                            else setSelectedForStatus(a);
                          }}
                          className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold capitalize transition hover:opacity-80 ${STATUS_CHIP[a.status] || "border-slate-200 bg-slate-100 text-slate-600"}`}
                        >
                          {a.status}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5 text-xs">
                          <button
                            type="button"
                            onClick={() => setSelectedDetailsId(id)}
                            className="inline-flex items-center rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark"
                          >
                            {t("common.view")}
                          </button>
                          {can("update_appointment") && (
                            <button
                              type="button"
                              onClick={() => handleEdit(id)}
                              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              {t("common.edit")}
                            </button>
                          )}
                          {can("delete_appointment") && (
                            <button
                              type="button"
                              onClick={() => handleDelete(id)}
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
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                    className={`inline-flex min-w-[2rem] items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-semibold tabular-nums transition ${
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
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("appt.next")}
              </button>
            </div>
            <span className="text-xs text-slate-500">
              {t("appt.showing_of", { start: rowStart, end: rowEnd, total: pagination.total })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
