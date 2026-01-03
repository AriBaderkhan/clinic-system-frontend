// src/pages/reports/MonthlyExpensesPage.jsx
import { useMemo, useState } from "react";
import useMonthlyExpenses from "../../hooks/useMonthlyExpenses";
import { calcTotalExpenses, formatMonth, formatMoney } from "../../utils/monthlyExpenses";
import MonthlyExpenseFormModal from "../../components/reports/MonthlyExpenseFormModal";
import MonthlyExpenseDetailsModal from "../../components/reports/MonthlyExpenseDetailsModal";

export default function MonthlyExpensesPage() {
  const { items, isLoading, error, refresh, create, update, remove, getOne } = useMonthlyExpenses();

  const [query, setQuery] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [formMode, setFormMode] = useState("create"); // create | edit
  const [activeRow, setActiveRow] = useState(null);

  const [openDetails, setOpenDetails] = useState(false);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items.filter((r) => {
      const m = formatMonth(r.month).toLowerCase();
      const company = String(r.company_name || "").toLowerCase();
      return m.includes(q) || company.includes(q);
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

  const onClickView = async (row) => {
    setOpenDetails(true);
    setDetails(null);
    setDetailsLoading(true);
    try {
      const one = await getOne(row.id);
      setDetails(one);
    } finally {
      setDetailsLoading(false);
    }
  };

  const onDelete = async (row) => {
    const ok = window.confirm(`Delete expenses for ${formatMonth(row.month)}?`);
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
            Manage monthly expense summaries for reporting and profit/loss.
          </p>
        </div>

        <button
          onClick={onClickCreate}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Add Monthly Expenses
        </button>
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by month or company..."
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
                <th className="px-5 py-3">Month</th>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Company Total</th>
                <th className="px-5 py-3">Total Expenses</th>
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
                    No monthly expenses found.
                  </td>
                </tr>
              ) : (
                filtered.map((row, idx) => {
                  const total = calcTotalExpenses(row);
                  return (
                    <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-5 py-4">{idx + 1}</td>
                      <td className="px-5 py-4">{formatMonth(row.month)}</td>
                      <td className="px-5 py-4">{row.company_name || "-"}</td>
                      <td className="px-5 py-4">{formatMoney(row.company_total)}</td>
                      <td className="px-5 py-4 font-medium">{formatMoney(total)}</td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => onClickView(row)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50"
                          >
                            View
                          </button>
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
                  );
                })
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

      <MonthlyExpenseDetailsModal
        open={openDetails}
        loading={detailsLoading}
        data={details}
        onClose={() => setOpenDetails(false)}
      />
    </div>
  );
}
