import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

export default function MonthlyExpenseFormModal({
  open,
  mode, // "create" | "edit"
  initialValue,
  onClose,
  onSubmit,
}) {
  const { t } = useTranslation();
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    type: "",
    amount: "",
    expense_date: "",
    note: ""
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        type: initialValue?.type || "",
        amount: initialValue?.amount || "",
        expense_date: initialValue?.expense_date ? initialValue.expense_date.split('T')[0] : new Date().toISOString().split('T')[0],
        note: initialValue?.note || ""
      });
    }
  }, [open, initialValue]);

  if (!open) return null;

  const title = isEdit ? t("exp.edit_expense") : t("exp.add_expense");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        amount: Number(form.amount)
      });
    } catch (err) {
      toast.error(err.userMessage || t("exp.save_failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-pop">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">{t("common.close")}</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t("exp.expense_type")}</label>
            <input
              required
              list="expense-types"
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
              placeholder={t("exp.type_ph")}
            />
            <datalist id="expense-types">
              <option value="Rent" />
              <option value="Salary" />
              <option value="Materials" />
              <option value="Electric" />
              <option value="Marketing" />
              <option value="Tax" />
              <option value="Other" />
            </datalist>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t("exp.amount")}</label>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t("exp.date")}</label>
            <input
              required
              type="date"
              value={form.expense_date}
              onChange={e => setForm({ ...form, expense_date: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t("exp.note")}</label>
            <textarea
              value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
              rows={3}
            />
          </div>

          <div className="-mx-5 flex justify-end gap-2 border-t border-slate-100 px-5 pt-4">
            <button type="button" onClick={onClose} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{t("common.cancel")}</button>
            <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
              {saving ? t("exp.saving") : t("exp.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
