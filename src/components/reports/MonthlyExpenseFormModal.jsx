// src/pages/reports/components/MonthlyExpenseFormModal.jsx
import { useEffect, useMemo, useState } from "react";
import { formatMonth, toMonthKey } from "../../utils/monthlyExpenses";

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function MonthlyExpenseFormModal({
  open,
  mode, // "create" | "edit"
  initialValue,
  onClose,
  onSubmit,
}) {
  const isEdit = mode === "edit";

  const initial = useMemo(() => {
    return {
      month: toMonthKey(initialValue?.month),
      materials: initialValue?.materials ?? 0,
      salary: initialValue?.salary ?? 0,
      company_name: initialValue?.company_name ?? "",
      company_total: initialValue?.company_total ?? 0,
      electric: initialValue?.electric ?? 0,
      rent: initialValue?.rent ?? 0,
      tax: initialValue?.tax ?? 0,
      marketing: initialValue?.marketing ?? 0,
      other: initialValue?.other ?? 0,
      notes: initialValue?.notes ?? "",
    };
  }, [initialValue]);

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

  if (!open) return null;

  const title = isEdit
    ? `Edit Expenses — ${formatMonth(form.month)}`
    : "Add Monthly Expenses";

  const set = (k) => (e) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
  };

  const submit = async (e) => {
    e.preventDefault();

    const monthKey = toMonthKey(form.month);
    if (!monthKey) return alert('Month is required like "2025-02-01".');
    if (!form.company_name.trim()) return alert("Company name is required.");

    const payload = {
      month: monthKey,
      materials: num(form.materials),
      salary: num(form.salary),
      company_name: form.company_name.trim(),
      company_total: num(form.company_total),
      electric: num(form.electric),
      rent: num(form.rent),
      tax: num(form.tax),
      marketing: num(form.marketing),
      other: num(form.other),
      notes: form.notes?.trim() || null,
    };

    setSaving(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (Array.isArray(err?.response?.data?.errors)
          ? err.response.data.errors.join("\n")
          : "") ||
        err?.message ||
        "Save failed";
      alert(msg);
      return;
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500">
              Enter totals for the selected month (one row per month).
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <form onSubmit={submit} className="p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs text-slate-600">Month (YYYY-MM-01)</label>
              <input
                value={form.month}
                onChange={set("month")}
                placeholder="2025-02-01"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                disabled={isEdit} // keep month stable on edit
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-slate-600">Company Name</label>
              <input
                value={form.company_name}
                onChange={set("company_name")}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
              />
            </div>

            {[
              ["materials", "Materials"],
              ["salary", "Salary"],
              ["company_total", "Company Total"],
              ["electric", "Electric"],
              ["rent", "Rent"],
              ["tax", "Tax"],
              ["marketing", "Marketing"],
              ["other", "Other"],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="text-xs text-slate-600">{label}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form[key]}
                  onChange={set(key)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                />
              </div>
            ))}

            <div className="md:col-span-3">
              <label className="text-xs text-slate-600">Notes</label>
              <textarea
                value={form.notes}
                onChange={set("notes")}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-70"
              disabled={saving}
            >
              {saving ? "Saving..." : isEdit ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
