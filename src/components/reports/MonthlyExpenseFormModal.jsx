import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function MonthlyExpenseFormModal({
  open,
  mode, // "create" | "edit"
  initialValue,
  onClose,
  onSubmit,
}) {
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

  const title = isEdit ? "Edit Expense" : "Add Expense";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        amount: Number(form.amount)
      });
    } catch (err) {
      toast.error(err.userMessage || "Failed to save expense.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50">Close</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-slate-600 mb-1">Expense Type</label>
            <input
              required
              list="expense-types"
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
              placeholder="e.g. Rent, Salary, Materials"
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
            <label className="block text-xs text-slate-600 mb-1">Amount</label>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-600 mb-1">Date</label>
            <input
              required
              type="date"
              value={form.expense_date}
              onChange={e => setForm({ ...form, expense_date: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-600 mb-1">Note</label>
            <textarea
              value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-[#015478] px-4 py-2 text-sm text-white hover:bg-[#013d58] disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
