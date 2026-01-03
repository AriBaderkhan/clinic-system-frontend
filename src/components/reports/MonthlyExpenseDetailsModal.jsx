// src/pages/reports/components/MonthlyExpenseDetailsModal.jsx
import {
  calcTotalExpenses,
  formatMonth,
  formatMoney,
  formatDateTime,
} from "../../utils/monthlyExpenses";

export default function MonthlyExpenseDetailsModal({ open, loading, data, onClose }) {
  if (!open) return null;

  const row = data || {};
  const total = calcTotalExpenses(row);

  const items = [
    ["Materials", row.materials],
    ["Salary", row.salary],
    ["Company Total", row.company_total],
    ["Electric", row.electric],
    ["Rent", row.rent],
    ["Tax", row.tax],
    ["Marketing", row.marketing],
    ["Other", row.other],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Monthly Expenses — {formatMonth(row.month)}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Company: <span className="font-medium text-slate-700">{row.company_name || "-"}</span>
              {" · "}
              Created by: <span className="font-medium text-slate-700">{row.created_by ?? "-"}</span>
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Created: <span className="font-medium text-slate-700">{formatDateTime(row.created_at)}</span>
              {" · "}
              Updated: <span className="font-medium text-slate-700">{formatDateTime(row.updated_at)}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="text-sm text-slate-500">Loading details...</div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total Expenses</span>
                  <span className="text-lg font-semibold">{formatMoney(total)}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {items.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                  >
                    <span className="text-sm text-slate-700">{label}</span>
                    <span className="text-sm font-medium">{formatMoney(value)}</span>
                  </div>
                ))}
              </div>

              {row.notes ? (
                <div className="mt-4 rounded-xl border border-slate-200 p-4">
                  <div className="text-xs text-slate-600">Notes</div>
                  <div className="mt-1 text-sm text-slate-800">{row.notes}</div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
