import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { getFloors, createFloor, updateFloor, deleteFloor, getStaffFloors, setStaffFloor } from "../../api/floorApi";

const inputCls = "rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100";

// Branch settings: the floors of this branch + each staff member's home floor.
// A floor is only a place; a doctor's appointments follow the doctor's floor.
export default function FloorsSettings() {
  const { t } = useTranslation();
  const [floors, setFloors] = useState([]);
  const [staff, setStaff] = useState([]);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  const load = useCallback(async () => {
    try {
      const [f, s] = await Promise.all([getFloors(), getStaffFloors()]);
      setFloors(f.data?.floors || []);
      setStaff(s.data || []);
    } catch (err) {
      toast.error(err.userMessage);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all([getFloors(), getStaffFloors()])
      .then(([f, s]) => { if (alive) { setFloors(f.data?.floors || []); setStaff(s.data || []); } })
      .catch((err) => toast.error(err.userMessage));
    return () => { alive = false; };
  }, []);

  // new floors go to the end of the list
  const nextOrder = floors.reduce((m, f) => Math.max(m, Number(f.sort_order) || 0), 0) + 1;

  const add = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await createFloor({ name: newName.trim(), sort_order: nextOrder });
      setNewName("");
      await load();
    } catch (err) {
      toast.error(err.userMessage);
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (f) => {
    if (!editName.trim()) return;
    try {
      await updateFloor(f.id, { name: editName.trim(), sort_order: Number(f.sort_order) || 0 });
      setEditId(null);
      await load();
    } catch (err) {
      toast.error(err.userMessage);
    }
  };

  const remove = async (f) => {
    if (!window.confirm(t("floor.delete_confirm", { name: f.name }))) return;
    try {
      await deleteFloor(f.id);
      await load();
    } catch (err) {
      toast.error(err.userMessage);
    }
  };

  const changeStaffFloor = async (person, value) => {
    try {
      await setStaffFloor(person.user_id, value ? Number(value) : null);
      setStaff((prev) => prev.map((p) => (p.user_id === person.user_id ? { ...p, floor_id: value ? Number(value) : null } : p)));
      toast.success(t("floor.saved_ok"));
    } catch (err) {
      toast.error(err.userMessage);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-slate-800 dark:border-slate-700">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("floor.title")}</h2>
      <p className="mb-4 text-xs text-slate-500">{t("floor.subtitle")}</p>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Floors */}
        <div>
          <div className="mb-3 flex gap-2">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={60}
              placeholder={t("floor.name_ph")} className={`${inputCls} flex-1`} />
            <button type="button" onClick={add} disabled={saving || !newName.trim()}
              className="rounded-lg bg-[#0E6E75] px-4 py-2 text-sm text-white hover:bg-[#0A565C] disabled:opacity-50">{t("floor.add_btn")}</button>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {floors.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                {editId === f.id ? (
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={60} autoFocus className={`${inputCls} flex-1`} />
                ) : (
                  <span className="font-medium text-slate-800 dark:text-slate-100">{f.name}</span>
                )}
                <span className="flex gap-1.5">
                  {editId === f.id ? (
                    <>
                      <button type="button" onClick={() => saveEdit(f)} className="rounded-lg bg-[#0E6E75] px-3 py-1 text-xs text-white hover:bg-[#0A565C]">{t("common.save")}</button>
                      <button type="button" onClick={() => setEditId(null)} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50">{t("common.cancel")}</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => { setEditId(f.id); setEditName(f.name); }} className="rounded-lg bg-amber-600 px-3 py-1 text-xs text-white hover:bg-amber-700">{t("common.edit")}</button>
                      <button type="button" onClick={() => remove(f)} className="rounded-lg bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700">{t("common.delete")}</button>
                    </>
                  )}
                </span>
              </li>
            ))}
            {floors.length === 0 && <li className="py-4 text-center text-sm text-slate-500">{t("floor.none")}</li>}
          </ul>
        </div>

        {/* Staff home floors */}
        <div>
          <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">{t("floor.staff_title")}</p>
          <p className="mb-2 text-[11px] text-slate-500">{t("floor.staff_hint")}</p>
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {staff.map((p) => (
              <li key={p.user_id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{p.full_name}</span>
                  <span className="ms-2 text-xs text-slate-500">{t(`floor.role_${p.role}`, p.role)}</span>
                </span>
                <select value={p.floor_id ?? ""} onChange={(e) => changeStaffFloor(p, e.target.value)} aria-label={p.full_name} className={inputCls}>
                  <option value="">{t("floor.no_floor")}</option>
                  {floors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
