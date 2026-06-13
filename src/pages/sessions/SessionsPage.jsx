import { useState } from "react";
import toast from "react-hot-toast";
import useSessions from "../../hooks/useSessions";
import SessionDetailsModal from "../../components/sessions/SessionDetailsModal";
import EditSessionModal from "../../components/sessions/EditSessionModal";
import { deleteSession } from "../../api/sessionApi";
import { useSettings } from "../../context/SettingContext";

function money(n) {
  const v = Number(n || 0);
  return v.toLocaleString();
}

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
  const { formatDateTime } = useSettings();
  const [selectedId, setSelectedId] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [dayFilter, setDayFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

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
  }

  const handleDelete = async (sessionId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this session?");
    if (!confirmDelete) return;
    try {
      await deleteSession(sessionId);
      await refresh();
    } catch (err) {
      toast.error(err.userMessage || "Failed to delete session.");
    }
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
          <h1 className="text-lg font-semibold text-slate-900">Sessions</h1>
          <p className="text-xs text-slate-500">
            Normal sessions only (unpaid first). View details and manage records.
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">

        {/* Filter bar */}
        <div className="mb-5 rounded-2xl bg-[#015478]/5 border border-[#015478]/10 px-4 py-4 flex flex-wrap items-end gap-4">

          {/* Search */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-[#015478]">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Patient or doctor name..."
              className="rounded-xl border border-[#015478]/20 bg-white px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#015478] focus:outline-none focus:ring-2 focus:ring-[#015478]/20"
            />
          </div>

          {/* Day */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#015478]">Day</label>
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="rounded-xl border border-[#015478]/20 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:border-[#015478] focus:outline-none focus:ring-2 focus:ring-[#015478]/20"
            >
              <option value="">All</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last_week">Last week</option>
              <option value="last_month">Last month</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={refresh}
              className="rounded-xl bg-[#015478] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#013d58] transition-colors"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => { setDayFilter(""); setSearchTerm(""); }}
              className="rounded-xl border border-[#015478]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#015478] hover:bg-[#015478]/5 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Count info */}
        <p className="mb-3 text-xs text-slate-400">
          {isLoading
            ? "Loading sessions…"
            : `Total: ${pagination.total} · Showing ${pagination.total === 0 ? 0 : rowStart}–${rowEnd}`}
        </p>

        {/* Error */}
        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && sessions.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
            No sessions match these filters.
          </div>
        )}

        {/* Table */}
        {sessions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Patient</th>
                  <th className="px-3 py-2 font-medium">Doctor</th>
                  <th className="px-3 py-2 font-medium">Finished</th>
                  <th className="px-3 py-2 font-medium">Total</th>
                  <th className="px-3 py-2 font-medium">Paid</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, idx) => {
                  const rowNumber = (page - 1) * pagination.limit + idx + 1;
                  return (
                    <tr key={s.session_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-800">{rowNumber}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">{s.patient_name}</td>
                      <td className="px-3 py-2 text-slate-700">{s.doctor_name}</td>
                      <td className="px-3 py-2 text-slate-700">
                        {formatDateTime(s.appointment_end_time)}
                      </td>
                      <td className="px-3 py-2 text-slate-800">{money(s.total)} IQD</td>
                      <td className="px-3 py-2 text-slate-800">{money(s.total_paid)} IQD</td>
                      <td className="px-3 py-2">
                        <span className={[
                          "rounded-full px-3 py-1 text-xs",
                          s.is_paid ? "bg-[#015478]/10 text-[#015478]" : "bg-amber-50 text-amber-700",
                        ].join(" ")}>
                          {s.is_paid ? "Paid" : "Unpaid"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => openView(s.session_id)}
                            className="rounded-md border border-slate-200 bg-[#015478] px-3 py-1 text-[11px] text-slate-100 hover:bg-[#013d58]"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(s.session_id)}
                            className="rounded-md border border-slate-200 bg-yellow-600 px-3 py-1 text-[11px] text-slate-100 hover:bg-yellow-900"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(s.session_id)}
                            className="rounded-md border border-red-200 bg-red-600 px-3 py-1 text-[11px] text-slate-100 hover:bg-red-900"
                          >
                            Delete
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
                Prev
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
                Next
              </button>
            </div>
            <span className="text-[11px] text-slate-400">
              Showing {rowStart}–{rowEnd} of {pagination.total} sessions
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
    </div>
  );
}
