// ✅ src/pages/reception/Sessions.jsx
import { useMemo, useState } from "react";
import useSessions from "../../hooks/useSessions";
import SessionDetailsModal from "../../components/sessions/SessionDetailsModal";
import EditSessionModal from "../../components/sessions/EditSessionModal";

function money(n) {
  const v = Number(n || 0);
  return v.toLocaleString();
}

export default function Sessions() {
  
  const [selectedId, setSelectedId] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [dayFilter, setDayFilter] = useState("");   // '', 'today', 'yesterday', 'last_week', 'last_month' // '', 'normal', 'urgent', 'walk_in'
  const [searchTerm, setSearchTerm] = useState("");
  
  const { sessions, isLoading, error, refresh } = useSessions({
    day: dayFilter,
    search: searchTerm,
  });

  const rows = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const ap = a.is_paid ? 1 : 0;
      const bp = b.is_paid ? 1 : 0;
      if (ap !== bp) return ap - bp; // unpaid first
      return new Date(b.created_at) - new Date(a.created_at); // newest first
    });
  }, [sessions]);

  function openView(id) {
    setSelectedId(id);
  }

  function openEdit(id) {
    setSelectedId(id);       // ✅ IMPORTANT: set id first
    setIsEditOpen(true);     // ✅ then open modal
  }

  function closeEdit() {
    setIsEditOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Sessions</h1>
          <p className="text-sm text-slate-500">
            Normal sessions only (unpaid first). View details and manage records.
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">

            {/* Day filter */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-500">Day:</span>
              <select
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">All</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last_week">Last week</option>
                <option value="last_month">Last month</option>
              </select>
            </div>

            {/* 🔍 Search */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-500">Search:</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Patient and doctor name"
                className="w-48 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        {isLoading && <p className="text-sm text-slate-600">Loading...</p>}
        {!!error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold text-slate-500">
                  <th className="px-3 py-3">#</th>
                  <th className="px-3 py-3">Patient</th>
                  <th className="px-3 py-3">Doctor</th>
                  <th className="px-3 py-3">Finished</th>
                  <th className="px-3 py-3">Total</th>
                  <th className="px-3 py-3">Paid</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((s, idx) => (
                  <tr key={s.session_id} className="border-b last:border-b-0">
                    <td className="px-3 py-3 text-slate-500">{idx + 1}</td>
                    <td className="px-3 py-3 font-medium text-slate-800">{s.patient_name}</td>
                    <td className="px-3 py-3 text-slate-700">{s.doctor_name}</td>
                    <td className="px-3 py-3 text-slate-700">
                      {s.appointment_end_time ? new Date(s.appointment_end_time).toLocaleString() : "-"}
                    </td>
                    <td className="px-3 py-3 text-slate-800">{money(s.total)} IQD</td>
                    <td className="px-3 py-3 text-slate-800">{money(s.total_paid)} IQD</td>
                    <td className="px-3 py-3">
                      <span
                        className={[
                          "rounded-full px-3 py-1 text-xs",
                          s.is_paid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
                        ].join(" ")}
                      >
                        {s.is_paid ? "Paid" : "Unpaid"}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openView(s.session_id)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() => openEdit(s.session_id)} // ✅ FIXED
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                      No sessions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ✅ View modal */}
      {selectedId && (
        <SessionDetailsModal
          sessionId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}

      {/* ✅ Edit modal (MUST be inside return, not floating in the file) */}
      {isEditOpen && selectedId && (
        <EditSessionModal
          sessionId={selectedId}
          onClose={closeEdit}
          onUpdated={() => {
            refresh(); // refresh list after update
          }}
        />
      )}
    </div>
  );
}
