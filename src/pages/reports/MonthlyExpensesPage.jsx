// src/pages/reports/MonthlyExpensesPage.jsx
import { useMemo, useState } from "react";
import useMonthlyExpenses from "../../hooks/useMonthlyExpenses";
import { formatMoney } from "../../utils/monthlyExpenses";
import MonthlyExpenseFormModal from "../../components/reports/MonthlyExpenseFormModal";

export default function MonthlyExpensesPage() {
  const { items, isLoading, error, refresh, create, update, remove, getOne } = useMonthlyExpenses();

  const [query, setQuery] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [formMode, setFormMode] = useState("create"); // create | edit
  const [activeRow, setActiveRow] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items.filter((r) => {
      const type = String(r.type || "").toLowerCase();
      const note = String(r.note || "").toLowerCase();
      return type.includes(q) || note.includes(q);
    });
  }, [items, query]);

  const onClickCreate = () => {
    setFormMode("create");
    setActiveRow(null);
    setOpenForm(true);
  };

  const onClickEdit = (row) => {
    setFormMode("edit");
    setActiveRow(row);
    setOpenForm(true);
  };

  const onDelete = async (row) => {
    const ok = window.confirm(`Delete expense "${row.type}"?`);
    if (!ok) return;
    await remove(row.id);
  };

  const onSubmit = async (payload) => {
    if (formMode === "create") {
      await create(payload);
    } else {
      await update(activeRow.id, payload);
    }
    setOpenForm(false);
  };

  const onClear = () => setQuery("");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Monthly Expenses</h1>
          <p className="text-xs text-slate-500">
            Log individual expenses (Rent, Salary, etc) to track profit/loss.
          </p>
        </div>

        <button
          onClick={onClickCreate}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Add Expense
        </button>
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by type or note..."
              className="w-[320px] max-w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
            >
              Refresh
            </button>
            <button
              onClick={onClear}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs text-slate-600">
              <tr>
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Note</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={6}>
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={6}>
                    No expenses found.
                  </td>
                </tr>
              ) : (
                filtered.map((row, idx) => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-5 py-4">{idx + 1}</td>
                    <td className="px-5 py-4">{row.expense_date ? new Date(row.expense_date).toLocaleDateString() : '-'}</td>
                    <td className="px-5 py-4 font-medium text-slate-900">{row.type}</td>
                    <td className="px-5 py-4">{formatMoney(row.amount)}</td>
                    <td className="px-5 py-4 text-slate-500 truncate max-w-[200px]">{row.note || '-'}</td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onClickEdit(row)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(row)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <MonthlyExpenseFormModal
        open={openForm}
        mode={formMode}
        initialValue={activeRow}
        onClose={() => setOpenForm(false)}
        onSubmit={onSubmit}
      />
    </div>
  );
}
