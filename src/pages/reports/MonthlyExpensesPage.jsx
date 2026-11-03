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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold text-slate-900">{t("exp.title")}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {t("exp.subtitle")}
          </p>
        </div>

        <button
          onClick={onClickCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {t("exp.add")}
        </button>
      </div>

      {/* Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex w-full items-center gap-2 sm:w-72">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("exp.search_ph")}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={refresh}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {t("exp.refresh")}
            </button>
            <button
              onClick={onClear}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {t("exp.clear")}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full text-start text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">#</th>
                <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t("exp.col_date")}</th>
                <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t("exp.col_type")}</th>
                <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t("exp.col_amount")}</th>
                <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t("exp.col_note")}</th>
                <th className="whitespace-nowrap px-4 py-3 text-end text-xs font-semibold uppercase tracking-wide text-slate-500">{t("exp.col_actions")}</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={6}>
                    {t("exp.loading")}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={6}>
                    {t("exp.empty")}
                  </td>
                </tr>
              ) : (
                filtered.map((row, idx) => (
                  <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500 tabular-nums">{idx + 1}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700 tabular-nums">{formatDate(row.expense_date)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.type}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900 tabular-nums">{formatMoney(row.amount)}</td>
                    <td className="max-w-xs break-words px-4 py-3 text-slate-500">{row.note || '-'}</td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onClickEdit(row)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          onClick={() => onDelete(row)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
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
