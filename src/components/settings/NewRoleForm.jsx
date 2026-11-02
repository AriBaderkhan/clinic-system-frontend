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
    <form onSubmit={submit} data-new-role className="grid gap-3 rounded-2xl border border-[#0E6E75]/20 bg-white p-5 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end dark:bg-slate-800">
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-slate-600">{t("roles.new_name")}</span>
        <input
          name="role_name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          required
          placeholder={t("roles.new_name_ph")}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-slate-600">{t("roles.new_base")}</span>
        <select name="base_role" value={baseId} onChange={(e) => setBaseId(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
          {roles.map((r) => <option key={r.id} value={r.id}>{roleLabel(r.name)}</option>)}
        </select>
      </label>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
          {t("common.cancel")}
        </button>
        <button type="submit" disabled={saving || name.trim().length < 2} className="rounded-lg bg-[#0E6E75] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A565C] disabled:opacity-50">
          {saving ? t("common.saving") : t("roles.create")}
        </button>
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-600 sm:col-span-3">
        <input type="checkbox" name="is_doctor" checked={isDoctor} onChange={(e) => setIsDoctor(e.target.checked)} className="h-4 w-4 accent-[#0E6E75]" />
        {t("roles.new_is_doctor")}
      </label>
      <p className="text-[11px] text-slate-500 sm:col-span-3">{t("roles.new_hint")}</p>
    </form>
  );
}
