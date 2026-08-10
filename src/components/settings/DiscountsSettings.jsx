import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { getDiscounts, createDiscount, updateDiscount, deleteDiscount } from "../../api/discountApi";

const EMPTY = { name: "", type: "percent", value: "" };

// Self-contained CRUD panel for branch discounts. Managers see + add + edit +
// remove named discounts (percent or fixed) that reception applies at pay time.
export default function DiscountsSettings() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY);       // add form
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getDiscounts();
      setRows(res?.data || []);
    } catch (err) {
      toast.error(err.userMessage || t("discount.load_failed"));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const valid = (f) => f.name.trim() && f.value !== "" && Number(f.value) >= 0;

  const add = async () => {
    if (!valid(form)) return toast.error(t("discount.invalid"));
    setSaving(true);
    try {
      await createDiscount({ name: form.name.trim(), type: form.type, value: Number(form.value) });
      setForm(EMPTY);
      await load();
      toast.success(t("discount.saved"));
    } catch (err) {
      toast.error(err.userMessage || t("discount.save_failed"));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (d) => { setEditId(d.id); setEditForm({ name: d.name, type: d.type, value: String(d.value) }); };
  const cancelEdit = () => { setEditId(null); setEditForm(EMPTY); };

  const saveEdit = async (id) => {
    if (!valid(editForm)) return toast.error(t("discount.invalid"));
    setSaving(true);
    try {
      await updateDiscount(id, { name: editForm.name.trim(), type: editForm.type, value: Number(editForm.value) });
      cancelEdit();
      await load();
      toast.success(t("discount.saved"));
    } catch (err) {
      toast.error(err.userMessage || t("discount.save_failed"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm(t("discount.confirm_delete"))) return;
    try {
      await deleteDiscount(id);
      await load();
      toast.success(t("discount.removed"));
    } catch (err) {
      toast.error(err.userMessage || t("discount.delete_failed"));
    }
  };

  const label = (d) => (d.type === "percent" ? `${d.value}%` : d.value);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">{t("discount.title")}</h3>
      <p className="mt-0.5 text-xs text-slate-500">{t("discount.hint")}</p>

      {/* Add row */}
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="min-w-[140px] flex-1">
          <label className="mb-1 block text-[11px] font-medium text-slate-600">{t("discount.name")}</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={t("discount.name_ph")}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#0E6E75] focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-slate-600">{t("discount.type")}</label>
          <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#0E6E75] focus:outline-none">
            <option value="percent">{t("discount.percent")}</option>
            <option value="fixed">{t("discount.fixed")}</option>
          </select>
        </div>
        <div className="w-24">
          <label className="mb-1 block text-[11px] font-medium text-slate-600">{t("discount.value")}</label>
          <input type="number" min="0" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#0E6E75] focus:outline-none" />
        </div>
        <button type="button" onClick={add} disabled={saving}
          className="rounded-lg bg-[#0E6E75] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A565C] disabled:opacity-50">
          {t("discount.add")}
        </button>
      </div>

      {/* List */}
      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-xs text-slate-500">{t("common.loading")}</p>
        ) : rows.length === 0 ? (
          <p className="text-xs text-slate-500">{t("discount.empty")}</p>
        ) : (
          rows.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              {editId === d.id ? (
                <>
                  <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className="min-w-[120px] flex-1 rounded-md border border-slate-200 px-2 py-1 text-sm" />
                  <select value={editForm.type} onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}
                    className="rounded-md border border-slate-200 px-2 py-1 text-sm">
                    <option value="percent">{t("discount.percent")}</option>
                    <option value="fixed">{t("discount.fixed")}</option>
                  </select>
                  <input type="number" min="0" value={editForm.value} onChange={(e) => setEditForm((f) => ({ ...f, value: e.target.value }))}
                    className="w-20 rounded-md border border-slate-200 px-2 py-1 text-sm" />
                  <button type="button" onClick={() => saveEdit(d.id)} disabled={saving}
                    className="rounded-md bg-[#0E6E75] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0A565C]">{t("discount.save")}</button>
                  <button type="button" onClick={cancelEdit}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:bg-slate-50">{t("discount.cancel")}</button>
                </>
              ) : (
                <>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{d.name}</span>
                  <span className="rounded bg-white px-2 py-0.5 text-xs font-semibold text-[#0E6E75]">{label(d)}</span>
                  <button type="button" onClick={() => startEdit(d)}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50">{t("discount.edit")}</button>
                  <button type="button" onClick={() => remove(d.id)}
                    className="rounded-md border border-red-200 bg-white px-3 py-1 text-xs text-red-600 hover:bg-red-50">{t("discount.delete")}</button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
