import { useState } from "react";
import toast from "react-hot-toast";
import useWorks from "../../hooks/useWorks";
import { useSettings } from "../../context/SettingContext";

const emptyForm = {
  code: "",
  name: "",
  min_price: "",
  allow_installments: false,
  min_installment_amount: "",
  is_active: true,
};

// ── View Modal ────────────────────────────────────────────────────────────────
function ViewModal({ work, onClose }) {
  const { formatMoney } = useSettings();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Work Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>
        <div className="space-y-3 text-sm">
          <DetailRow label="Code" value={<span className="font-mono">{work.code}</span>} />
          <DetailRow label="Name" value={work.name} />
          <DetailRow label="Min Price" value={formatMoney(work.min_price)} />
          <DetailRow
            label="Allow Installments"
            value={
              <span className={`rounded-full px-3 py-1 text-xs ${work.allow_installments ? "bg-[#015478]/10 text-[#015478]" : "bg-slate-100 text-slate-500"}`}>
                {work.allow_installments ? "Yes" : "No"}
              </span>
            }
          />
          {work.allow_installments && (
            <DetailRow label="Min Installment Amount" value={formatMoney(work.min_installment_amount)} />
          )}
          <DetailRow
            label="Status"
            value={
              <span className={`rounded-full px-3 py-1 text-xs ${work.is_active ? "bg-[#015478]/10 text-[#015478]" : "bg-red-100 text-red-700"}`}>
                {work.is_active ? "Active" : "Inactive"}
              </span>
            }
          />
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

// ── Form Modal (create + edit) ────────────────────────────────────────────────
function WorkFormModal({ mode, initial, onClose, onSubmit, isSubmitting }) {
  const { settings } = useSettings();
  const curr = settings?.currency_code || "";
  const [form, setForm] = useState(
    mode === "edit"
      ? { ...initial, min_installment_amount: initial.min_installment_amount ?? "" }
      : emptyForm
  );

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      min_price: Number(form.min_price),
      allow_installments: form.allow_installments,
      is_active: form.is_active,
    };
    if (form.allow_installments) {
      payload.min_installment_amount = Number(form.min_installment_amount);
    }
    await onSubmit(payload);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            {mode === "edit" ? "Edit Work" : "Create Work"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Code">
            <input
              required
              value={form.code}
              onChange={(e) => set("code", e.target.value)}
              placeholder="e.g. CROWN"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
            />
          </FormField>

          <FormField label="Name">
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Crown Placement"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
            />
          </FormField>

          <FormField label={`Min Price${curr ? ` (${curr})` : ""}`}>
            <input
              required
              type="number"
              min={0}
              step="0.01"
              value={form.min_price}
              onChange={(e) => set("min_price", e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
            />
          </FormField>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="allow_installments"
              checked={form.allow_installments}
              onChange={(e) => {
                set("allow_installments", e.target.checked);
                if (!e.target.checked) set("min_installment_amount", "");
              }}
              className="h-4 w-4 accent-[#015478]"
            />
            <label htmlFor="allow_installments" className="text-sm text-slate-700">
              Allow Installments
            </label>
          </div>

          {form.allow_installments && (
            <FormField label={`Min Installment Amount${curr ? ` (${curr})` : ""}`}>
              <input
                required
                type="number"
                min={0}
                step="0.01"
                value={form.min_installment_amount}
                onChange={(e) => set("min_installment_amount", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
              />
            </FormField>
          )}

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => set("is_active", e.target.checked)}
              className="h-4 w-4 accent-[#015478]"
            />
            <label htmlFor="is_active" className="text-sm text-slate-700">Active</label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[#015478] px-4 py-2 text-sm text-white hover:bg-[#013d58] disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : mode === "edit" ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function WorksPage() {
  const { formatMoney } = useSettings();
  const { works, isLoading, error, refresh, create, update, remove, isSubmitting } = useWorks();
  const [viewWork, setViewWork] = useState(null);
  const [editWork, setEditWork] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleCreate = async (payload) => {
    const result = await create(payload);
    if (result.ok) {
      toast.success("Work created successfully");
      setIsCreateOpen(false);
    } else {
      toast.error(result.error);
    }
  };

  const handleUpdate = async (payload) => {
    const result = await update(editWork.id, payload);
    if (result.ok) {
      toast.success("Work updated successfully");
      setEditWork(null);
    } else {
      toast.error(result.error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate this work?")) return;
    const result = await remove(id);
    if (!result.ok) toast.error(result.error);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Work Catalog</h1>
          <p className="text-sm text-slate-500">Manage procedures and services for this branch.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={refresh}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="rounded-lg bg-[#015478] px-4 py-2 text-sm text-white hover:bg-[#013d58]"
          >
            + Create Work
          </button>
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
                  <th className="px-3 py-3">Code</th>
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Min Price</th>
                  <th className="px-3 py-3">Installments</th>
                  <th className="px-3 py-3">Min Installment</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {works.map((w, idx) => (
                  <tr key={w.id} className="border-b last:border-b-0">
                    <td className="px-3 py-3 text-slate-500">{idx + 1}</td>
                    <td className="px-3 py-3 font-mono font-medium text-slate-800">{w.code}</td>
                    <td className="px-3 py-3 text-slate-700">{w.name}</td>
                    <td className="px-3 py-3 text-slate-800">{formatMoney(w.min_price)}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs ${w.allow_installments ? "bg-[#015478]/10 text-[#015478]" : "bg-slate-100 text-slate-500"}`}>
                        {w.allow_installments ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {w.allow_installments ? formatMoney(w.min_installment_amount) : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs ${w.is_active ? "bg-[#015478]/10 text-[#015478]" : "bg-red-100 text-red-700"}`}>
                        {w.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setViewWork(w)}
                        className="rounded-lg border border-slate-200 bg-[#015478] px-3 py-2 text-xs text-slate-100 hover:bg-[#013d58]"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditWork(w)}
                        className="rounded-lg border border-slate-200 bg-yellow-600 px-3 py-2 text-xs text-slate-100 hover:bg-yellow-900"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(w.id)}
                        className="rounded-lg border border-slate-200 bg-red-600 px-3 py-2 text-xs text-slate-100 hover:bg-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {works.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                      No works found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewWork && (
        <ViewModal work={viewWork} onClose={() => setViewWork(null)} />
      )}

      {isCreateOpen && (
        <WorkFormModal
          mode="create"
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreate}
          isSubmitting={isSubmitting}
        />
      )}

      {editWork && (
        <WorkFormModal
          mode="edit"
          initial={editWork}
          onClose={() => setEditWork(null)}
          onSubmit={handleUpdate}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
