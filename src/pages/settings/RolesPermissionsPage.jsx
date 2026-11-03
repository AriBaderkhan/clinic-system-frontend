import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { getBranchRoles, getRolePermissions, saveRolePermissions, renameRole, deleteRole } from "../../api/rolePermissionApi";
import { useSubscription } from "../../context/SubscriptionContext";
import NewRoleForm from "../../components/settings/NewRoleForm";
import PageHeader from "../../components/common/PageHeader";

// screen order of the groups
const GROUPS = ["dashboards", "patients", "appointments", "visits", "payments", "reports", "settings"];

// Roles & permissions for the CURRENT branch. The server checks every rule again
// (own role, only what you have, plan, own/all) — the screen only makes them visible.
export default function RolesPermissionsPage() {
  const { t } = useTranslation();
  const [roles, setRoles] = useState([]);
  const [roleId, setRoleId] = useState(null);
  const [data, setData] = useState(null);     // what the server has
  const [draft, setDraft] = useState({});     // key -> { granted, scope } being edited
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showNew, setShowNew] = useState(false);
  const { hasFeature } = useSubscription();
  const canCustom = hasFeature("custom_roles");

  const toDraft = (perms) => Object.fromEntries(perms.map((p) => [p.key, { granted: p.granted, scope: p.scope }]));

  // load the role tabs; open selectId (or the first role the user can change)
  const loadRoles = (selectId) => getBranchRoles()
    .then((res) => {
      const list = res.data || [];
      setRoles(list);
      const pick = list.find((r) => Number(r.id) === Number(selectId)) || list.find((r) => r.can_edit) || list[0];
      if (pick) setRoleId(pick.id); else setLoading(false);
    })
    .catch((err) => { setError(err.userMessage || t("roles.load_failed")); setLoading(false); });

  useEffect(() => { loadRoles(); }, [t]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadRole = async (id) => {
    setLoading(true);
    setError("");
    try {
      const res = await getRolePermissions(id);
      setData(res.data);
      setDraft(toDraft(res.data.permissions));
    } catch (err) {
      setError(err.userMessage || t("roles.load_failed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roleId) loadRole(roleId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId]);

  const perms = data?.permissions || [];
  const canEdit = !!data?.role?.can_edit;
  const changed = perms.filter((p) => draft[p.key] && (draft[p.key].granted !== p.granted || (draft[p.key].granted && draft[p.key].scope !== p.scope)));
  const dirty = changed.length > 0;
  const roleLabel = (name) => t(`floor.role_${name}`, name);

  const chooseRole = (id) => {
    if (Number(id) === Number(roleId)) return;
    if (dirty && !window.confirm(t("roles.discard"))) return;
    setRoleId(Number(id));
  };

  const toggle = (p) => {
    if (!canEdit || p.locked) return;
    setDraft((d) => {
      const on = !d[p.key].granted;
      // a new view tick starts with the widest scope the user may give
      const scope = p.has_scope && on ? (d[p.key].scope || p.max_scope || "all") : d[p.key].scope;
      return { ...d, [p.key]: { granted: on, scope } };
    });
  };

  const setScope = (p, scope) => {
    if (!canEdit || p.locked) return;
    setDraft((d) => ({ ...d, [p.key]: { ...d[p.key], scope } }));
  };

  // back to the role's defaults — only for ticks this user may change
  const resetToDefault = () => {
    setDraft((d) => {
      const next = { ...d };
      for (const p of perms) {
        if (p.locked === "not_yours") continue;
        if (p.locked === "plan" && !p.granted) continue;
        const scope = p.has_scope ? (p.default_scope || p.max_scope || "all") : null;
        next[p.key] = { granted: p.is_default, scope: p.is_default ? scope : d[p.key].scope };
      }
      return next;
    });
    toast(t("roles.reset_hint"));
  };

  const save = async () => {
    const keys = perms.filter((p) => draft[p.key]?.granted).map((p) => p.key);
    const scopes = Object.fromEntries(perms.filter((p) => p.has_scope && draft[p.key]?.granted).map((p) => [p.key, draft[p.key].scope || "all"]));
    setSaving(true);
    try {
      const res = await saveRolePermissions(roleId, keys, scopes);
      const r = res.data || {};
      const any = (r.added?.length || 0) + (r.removed?.length || 0) + (r.rescoped?.length || 0);
      toast.success(any ? t("roles.saved", { role: roleLabel(data.role.name) }) : t("roles.nothing"));
      await loadRole(roleId);
    } catch (err) {
      toast.error(err.userMessage || t("roles.load_failed"));
    } finally {
      setSaving(false);
    }
  };

  const onCreated = (role) => { setShowNew(false); loadRoles(role.id); };

  const doRename = async () => {
    const name = window.prompt(t("roles.rename_prompt"), data.role.name);
    if (!name || name.trim() === data.role.name) return;
    try {
      await renameRole(roleId, name.trim());
      toast.success(t("roles.renamed"));
      loadRoles(roleId);
      loadRole(roleId);
    } catch (err) {
      toast.error(err.userMessage || t("roles.create_failed"));
    }
  };

  const doDelete = async () => {
    if (!window.confirm(t("roles.delete_confirm", { role: data.role.name }))) return;
    try {
      await deleteRole(roleId);
      toast.success(t("roles.deleted", { role: data.role.name }));
      setData(null);
      loadRoles();
    } catch (err) {
      toast.error(err.userMessage || t("roles.create_failed"));
    }
  };

  const grouped = GROUPS.map((g) => ({ g, items: perms.filter((p) => p.group_key === g) })).filter((x) => x.items.length);

  return (
    <div className="w-full space-y-5">
      <PageHeader
        title={t("roles.title")}
        subtitle={t("roles.subtitle", { branch: t("roles.this_branch") })}
        actions={canEdit && (
          <>
            <button
              type="button"
              onClick={resetToDefault}
              disabled={saving || loading}
              className="rounded-xl border border-slate-200 bg-white/10 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-white/20 disabled:opacity-50"
            >
              {t("roles.reset")}
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!dirty || saving || loading}
              className="rounded-xl bg-aqua px-4 py-2.5 text-sm font-bold text-ocean-deep transition hover:brightness-110 disabled:opacity-50"
            >
              {saving ? t("common.saving") : t("roles.save")}
            </button>
          </>
        )}
      />

      {showNew && <NewRoleForm roles={roles} roleLabel={roleLabel} onCreated={onCreated} onCancel={() => setShowNew(false)} />}

      {/* role tabs */}
      <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-card" role="tablist" aria-label={t("roles.role")}>
        {roles.map((r) => (
          <button
            key={r.id}
            type="button"
            role="tab"
            aria-selected={Number(r.id) === Number(roleId)}
            onClick={() => chooseRole(r.id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${Number(r.id) === Number(roleId)
              ? "bg-brand text-white"
              : "text-slate-600 hover:bg-slate-50"}`}
          >
            {roleLabel(r.name)}
          </button>
        ))}
        {/* custom roles are a Pro feature: shown locked on other plans */}
        <button
          type="button"
          onClick={() => canCustom && setShowNew(true)}
          disabled={!canCustom || showNew}
          title={canCustom ? "" : t("roles.locked_plan")}
          className="rounded-lg border border-dashed border-brand/40 px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {canCustom ? t("roles.new_role") : `🔒 ${t("roles.new_role")} · Pro`}
        </button>
      </div>

      {data?.role?.is_custom && canEdit && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-card">
          <span className="me-auto">{data.role.is_doctor ? t("roles.custom_doctor") : t("roles.custom")}</span>
          <button type="button" onClick={doRename} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">{t("roles.rename")}</button>
          <button type="button" onClick={doDelete} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50">{t("roles.delete")}</button>
        </div>
      )}

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}
      {data && !canEdit && <div className="rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-sm text-sky-800">{t("roles.own_role")}</div>}
      {dirty && <p className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">{t("roles.unsaved")}</p>}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
          {grouped.map(({ g, items }) => (
            <section key={g} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <h2 className="text-[15px] font-semibold text-slate-900">{t(`roles.groups.${g}`, g)}</h2>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 tabular-nums">
                  {t("roles.count", { on: items.filter((p) => draft[p.key]?.granted).length, total: items.length })}
                </span>
              </div>
              <ul className="space-y-1">
                {items.map((p) => {
                  const d = draft[p.key] || {};
                  const disabled = !canEdit || !!p.locked;
                  return (
                    <li key={p.key} className="rounded-xl px-2.5 py-2 transition hover:bg-slate-50">
                      <label className={`flex items-start gap-3 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
                        <input
                          type="checkbox"
                          data-key={p.key}
                          checked={!!d.granted}
                          disabled={disabled}
                          onChange={() => toggle(p)}
                          className="mt-0.5 h-4 w-4 accent-brand"
                        />
                        <span className="min-w-0 flex-1">
                          <span className={`block text-sm ${disabled ? "text-slate-400" : "text-slate-800"}`}>
                            {t(`roles.perm.${p.key}`, p.description || p.key)}
                          </span>
                          <span className="mt-0.5 flex flex-wrap gap-1.5">
                            {p.is_default && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{t("roles.default")}</span>}
                            {p.locked === "not_yours" && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">🔒 {t("roles.locked_not_yours")}</span>}
                            {p.locked === "plan" && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">🔒 {t("roles.locked_plan")}</span>}
                          </span>
                        </span>
                      </label>
                      {p.has_scope && d.granted && (
                        <div className="ms-7 mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>{t("roles.scope_hint")}:</span>
                          <select
                            data-scope={p.key}
                            value={d.scope || "all"}
                            disabled={disabled}
                            onChange={(e) => setScope(p, e.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:opacity-60"
                          >
                            <option value="own">{t("roles.own")}</option>
                            {/* nobody gives a wider view than they have */}
                            <option value="all" disabled={p.max_scope === "own"}>{t("roles.all")}</option>
                          </select>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
