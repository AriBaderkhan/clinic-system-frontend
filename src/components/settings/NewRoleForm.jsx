import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { createRole } from "../../api/rolePermissionApi";

// "+ New role": a name, which role it starts as a copy of, and whether it treats patients.
// The server copies only the ticks the creator may give.
export default function NewRoleForm({ roles, roleLabel, onCreated, onCancel }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [baseId, setBaseId] = useState(roles[0]?.id || "");
  const [isDoctor, setIsDoctor] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await createRole({ name: name.trim(), base_role_id: Number(baseId), is_doctor: isDoctor });
      toast.success(t("roles.created", { role: res.data.name }));
      onCreated(res.data);
    } catch (err) {
      toast.error(err.userMessage || t("roles.create_failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} data-new-role className="grid grid-cols-1 gap-3 rounded-2xl border border-brand/30 bg-white p-4 shadow-card sm:p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
      <label className="min-w-0 text-sm">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">{t("roles.new_name")}</span>
        <input
          name="role_name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          required
          placeholder={t("roles.new_name_ph")}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
        />
      </label>
      <label className="min-w-0 text-sm">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">{t("roles.new_base")}</span>
        <select name="base_role" value={baseId} onChange={(e) => setBaseId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15">
          {roles.map((r) => <option key={r.id} value={r.id}>{roleLabel(r.name)}</option>)}
        </select>
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onCancel} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
          {t("common.cancel")}
        </button>
        <button type="submit" disabled={saving || name.trim().length < 2} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
          {saving ? t("common.saving") : t("roles.create")}
        </button>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-3">
        <input type="checkbox" name="is_doctor" checked={isDoctor} onChange={(e) => setIsDoctor(e.target.checked)} className="h-4 w-4 accent-brand" />
        {t("roles.new_is_doctor")}
      </label>
      <p className="text-xs text-slate-500 md:col-span-3">{t("roles.new_hint")}</p>
    </form>
  );
}
