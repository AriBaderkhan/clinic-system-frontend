import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import useMonthlyExpenses from "../../hooks/useMonthlyExpenses";
import { useSettings } from "../../context/SettingContext";
import MonthlyExpenseFormModal from "../../components/reports/MonthlyExpenseFormModal";

export default function MonthlyExpensesPage() {
  const { t } = useTranslation();
  const { formatDate, formatMoney } = useSettings();
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
    const ok = window.confirm(t("exp.delete_confirm", { type: row.type }));
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{t("exp.title")}</h1>
          <p className="text-xs text-slate-500">
            {t("exp.subtitle")}
          </p>
        </div>

        <button
          onClick={onClickCreate}
          className="rounded-lg bg-[#015478] px-4 py-2 text-sm font-medium text-white hover:bg-[#013d58]"
        >
          {t("exp.add")}
        </button>
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("exp.search_ph")}
              className="w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
            >
              {t("exp.refresh")}
            </button>
            <button
              onClick={onClear}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
            >
              {t("exp.clear")}
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
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs text-slate-600">
              <tr>
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">{t("exp.col_date")}</th>
                <th className="px-5 py-3">{t("exp.col_type")}</th>
                <th className="px-5 py-3">{t("exp.col_amount")}</th>
                <th className="px-5 py-3">{t("exp.col_note")}</th>
                <th className="px-5 py-3 text-end">{t("exp.col_actions")}</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={6}>
                    {t("exp.loading")}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={6}>
                    {t("exp.empty")}
                  </td>
                </tr>
              ) : (
                filtered.map((row, idx) => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-5 py-4">{idx + 1}</td>
                    <td className="px-5 py-4">{formatDate(row.expense_date)}</td>
                    <td className="px-5 py-4 font-medium text-slate-900">{row.type}</td>
                    <td className="px-5 py-4">{formatMoney(row.amount)}</td>
                    <td className="px-5 py-4 text-slate-500">{row.note || '-'}</td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onClickEdit(row)}
                          className="rounded-md border border-slate-200 bg-yellow-600 px-3 py-1 text-[11px] text-white hover:bg-yellow-900"
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          onClick={() => onDelete(row)}
                          className="rounded-md border border-red-200 bg-red-600 px-3 py-1 text-[11px] text-white hover:bg-red-900"
                        >
                          {t("common.delete")}
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
