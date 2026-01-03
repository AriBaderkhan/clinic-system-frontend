// src/pages/history/PaymentHistory.jsx
import { useState } from "react";
import usePaymentHistory from "../../hooks/usePaymentHistory";
import SessionDetailsModal from "../../components/sessions/SessionDetailsModal";

function formatDateTime(iso) {
  if (!iso) return "-";
  const date = new Date(iso);

  const datePart = date.toLocaleDateString([], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const timePart = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${datePart} • ${timePart}`;
}

function PaymentHistory() {
  const { payments, isLoading, error, refresh } = usePaymentHistory();
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  const totalAmount = payments.reduce((sum, p) => {
    const val = Number(p.amount || 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Session details modal */}
      {selectedSessionId && (
        <SessionDetailsModal
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Payment History
          </h1>
          <p className="text-xs text-slate-500">
            All payments collected in the clinic.
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600 hover:bg-slate-100"
        >
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">
            Total collected (all time)
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {totalAmount.toLocaleString("en-US")} IQD
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">
            Total payments
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {isLoading ? "…" : payments.length}
          </p>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Payment History
            </h2>
            <p className="text-[11px] text-slate-500">
              Date &amp; time, patient, doctor, amount, reception staff and
              note. Click a row to see full session details.
            </p>
          </div>
        </div>

        {/* Errors */}
        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && !error && (
          <p className="text-xs text-slate-500">Loading payment history…</p>
        )}

        {/* Empty */}
        {!isLoading && !error && payments.length === 0 && (
          <p className="text-xs text-slate-500">No payments found.</p>
        )}

        {/* Table */}
        {!isLoading && !error && payments.length > 0 && (
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="px-3 py-2 font-medium text-[#1DB954]">
                    Date &amp; Time
                  </th>
                  <th className="px-3 py-2 font-medium text-[#1DB954]">
                    Patient
                  </th>
                  <th className="px-3 py-2 font-medium text-[#1DB954]">
                    Doctor
                  </th>
                  <th className="px-3 py-2 font-medium text-[#1DB954]">
                    Amount
                  </th>
                  <th className="px-3 py-2 font-medium text-[#1DB954]">
                    Reception
                  </th>
                  <th className="px-3 py-2 font-medium text-[#1DB954]">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedSessionId(p.session_id)}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="px-3 py-2 text-slate-700">
                      {formatDateTime(p.created_at)}
                    </td>
                    <td className="px-3 py-2 text-slate-800">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium">
                          {p.patient_name}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {p.patient_phone}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {p.doctor_name}
                    </td>
                    <td className="px-3 py-2 text-slate-800">
                      {Number(p.amount || 0).toLocaleString("en-US")} IQD
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {p.processed_by || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700 max-w-xs">
                      <span className="line-clamp-2 text-[12px]">
                        {p.note || "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentHistory;
