import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  is_plan: false,
  is_whole_mouth: false,
};

// ── View Modal ────────────────────────────────────────────────────────────────
function ViewModal({ work, onClose }) {
  const { t } = useTranslation();
  const { formatMoney } = useSettings();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">{t("clin.work_details")}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>
        <div className="space-y-3 text-sm">
          <DetailRow label={t("clin.code")} value={<span className="font-mono">{work.code}</span>} />
          <DetailRow label={t("clin.name")} value={work.name} />
          <DetailRow label={t("clin.min_price")} value={formatMoney(work.min_price)} />
          <DetailRow
            label={t("clin.allow_installments")}
            value={
              <span className={`rounded-full px-3 py-1 text-xs ${work.allow_installments ? "bg-[#0E6E75]/10 text-[#0E6E75]" : "bg-slate-100 text-slate-500"}`}>
                {work.allow_installments ? t("clin.yes") : t("clin.no")}
              </span>
            }
          />
          {work.allow_installments && (
            <DetailRow label={t("clin.min_installment_amount")} value={formatMoney(work.min_installment_amount)} />
          )}
          <DetailRow
            label={t("clin.status")}
            value={
              <span className={`rounded-full px-3 py-1 text-xs ${work.is_active ? "bg-[#0E6E75]/10 text-[#0E6E75]" : "bg-red-100 text-red-700"}`}>
                {work.is_active ? t("clin.active") : t("clin.inactive")}
              </span>
            }
          />
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            {t("common.close")}
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
  const { t } = useTranslation();
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
      is_plan: form.is_plan,
      is_whole_mouth: form.is_whole_mouth,
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
            {mode === "edit" ? t("clin.edit_work") : t("clin.create_work")}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={t("clin.code")}>
            <input
              required
              value={form.code}
              onChange={(e) => set("code", e.target.value)}
              placeholder={t("clin.code_ph")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#0E6E75] focus:outline-none focus:ring-1 focus:ring-[#0E6E75]"
            />
          </FormField>

          <FormField label={t("clin.name")}>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder={t("clin.name_ph")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#0E6E75] focus:outline-none focus:ring-1 focus:ring-[#0E6E75]"
            />
          </FormField>

          <FormField label={`${t("clin.min_price")}${curr ? ` (${curr})` : ""}`}>
            <input
              required
              type="number"
              min={0}
              step="0.01"
              value={form.min_price}
              onChange={(e) => set("min_price", e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#0E6E75] focus:outline-none focus:ring-1 focus:ring-[#0E6E75]"
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
              className="h-4 w-4 accent-[#0E6E75]"
            />
            <label htmlFor="allow_installments" className="text-sm text-slate-700">
              {t("clin.allow_installments")}
            </label>
          </div>

          {form.allow_installments && (
            <FormField label={`${t("clin.min_installment_amount")}${curr ? ` (${curr})` : ""}`}>
              <input
                required
                type="number"
                min={0}
                step="0.01"
                value={form.min_installment_amount}
                onChange={(e) => set("min_installment_amount", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#0E6E75] focus:outline-none focus:ring-1 focus:ring-[#0E6E75]"
              />
            </FormField>
          )}

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => set("is_active", e.target.checked)}
              className="h-4 w-4 accent-[#0E6E75]"
            />
            <label htmlFor="is_active" className="text-sm text-slate-700">{t("clin.active")}</label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_plan"
              checked={form.is_plan}
              onChange={(e) => set("is_plan", e.target.checked)}
              className="h-4 w-4 accent-[#0E6E75]"
            />
            <label htmlFor="is_plan" className="text-sm text-slate-700">{t("clin.is_plan")}</label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_whole_mouth"
              checked={form.is_whole_mouth}
              onChange={(e) => set("is_whole_mouth", e.target.checked)}
              className="h-4 w-4 accent-[#0E6E75]"
            />
            <label htmlFor="is_whole_mouth" className="text-sm text-slate-700">{t("clin.is_whole_mouth")}</label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[#0E6E75] px-4 py-2 text-sm text-white hover:bg-[#0A565C] disabled:opacity-60"
            >
              {isSubmitting ? t("clin.saving") : mode === "edit" ? t("clin.save_changes") : t("clin.create")}
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
  const { t } = useTranslation();
  const { formatMoney } = useSettings();
  const { works, isLoading, error, refresh, create, update, remove, isSubmitting } = useWorks();
  const [viewWork, setViewWork] = useState(null);
  const [editWork, setEditWork] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleCreate = async (payload) => {
    const result = await create(payload);
    if (result.ok) {
      toast.success(t("clin.work_created_ok"));
      setIsCreateOpen(false);
    } else {
      toast.error(result.error);
    }
  };

  const handleUpdate = async (payload) => {
    const result = await update(editWork.id, payload);
    if (result.ok) {
      toast.success(t("clin.work_updated_ok"));
      setEditWork(null);
    } else {
      toast.error(result.error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("clin.deactivate_confirm"))) return;
    const result = await remove(id);
    if (!result.ok) toast.error(result.error);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{t("clin.catalog_title")}</h1>
          <p className="text-sm text-slate-500">{t("clin.catalog_subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={refresh}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            {t("clin.refresh")}
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="rounded-lg bg-[#0E6E75] px-4 py-2 text-sm text-white hover:bg-[#0A565C]"
          >
            {t("clin.create_work_btn")}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        {isLoading && <p className="text-sm text-slate-600">{t("clin.loading")}</p>}
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
                  <th className="px-3 py-3">{t("clin.col_code")}</th>
                  <th className="px-3 py-3">{t("clin.col_name")}</th>
                  <th className="px-3 py-3">{t("clin.col_min_price")}</th>
                  <th className="px-3 py-3">{t("clin.col_installments")}</th>
                  <th className="px-3 py-3">{t("clin.col_min_installment")}</th>
                  <th className="px-3 py-3">{t("clin.col_status")}</th>
                  <th className="px-3 py-3 text-end">{t("clin.col_actions")}</th>
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
                      <span className={`rounded-full px-3 py-1 text-xs ${w.allow_installments ? "bg-[#0E6E75]/10 text-[#0E6E75]" : "bg-slate-100 text-slate-500"}`}>
                        {w.allow_installments ? t("clin.yes") : t("clin.no")}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {w.allow_installments ? formatMoney(w.min_installment_amount) : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs ${w.is_active ? "bg-[#0E6E75]/10 text-[#0E6E75]" : "bg-red-100 text-red-700"}`}>
                        {w.is_active ? t("clin.active") : t("clin.inactive")}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setViewWork(w)}
                        className="rounded-lg border border-slate-200 bg-[#0E6E75] px-3 py-2 text-xs text-slate-100 hover:bg-[#0A565C]"
                      >
                        {t("common.view")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditWork(w)}
                        className="rounded-lg border border-slate-200 bg-amber-600 px-3 py-2 text-xs text-slate-100 hover:bg-amber-700"
                      >
                        {t("common.edit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(w.id)}
                        className="rounded-lg border border-slate-200 bg-red-600 px-3 py-2 text-xs text-slate-100 hover:bg-red-700"
                      >
                        {t("common.delete")}
                      </button>
                    </td>
                  </tr>
                ))}
                {works.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                      {t("clin.no_works")}
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
