import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { getAllDoctors } from "../../api/doctorApi";
import {
  createSpecialty, updateSpecialty, deleteSpecialty,
  getDoctorSettings, saveDoctorSettings,
} from "../../api/specialtyApi";

const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15";

// Add / rename a specialty
function SpecialtyFormModal({ initial, onClose, onSaved }) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial?.name || "");
  const [usesTeeth, setUsesTeeth] = useState(!!initial?.uses_teeth);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { name: name.trim(), uses_teeth: usesTeeth };
      if (initial) await updateSpecialty(initial.id, data);
      else await createSpecialty(data);
      toast.success(t("spec.saved_ok"));
      onSaved();
    } catch (err) {
      toast.error(err.userMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-sm space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-pop sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">{initial ? t("spec.edit_specialty") : t("spec.add_specialty")}</h2>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">{t("spec.name")}</label>
          <input required maxLength={60} value={name} onChange={(e) => setName(e.target.value)}
            placeholder={t("spec.name_ph")} className={inputCls} />
        </div>
        <label className="flex items-center gap-3 text-sm text-slate-700">
          <input type="checkbox" checked={usesTeeth} onChange={(e) => setUsesTeeth(e.target.checked)} className="h-4 w-4 accent-brand" />
          {t("spec.uses_teeth")}
        </label>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" onClick={onClose} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{t("common.cancel")}</button>
          <button type="submit" disabled={saving || !name.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
            {saving ? t("clin.saving") : t("clin.save_changes")}
          </button>
        </div>
      </form>
    </div>
  );
}

// A doctor's specialty + extra treatments ticked for this doctor only
function DoctorSettingsModal({ doctor, specialties, works, onClose, onSaved }) {
  const { t } = useTranslation();
  const [specialtyId, setSpecialtyId] = useState("");
  const [extraIds, setExtraIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getDoctorSettings(doctor.id);
        setSpecialtyId(res.data?.specialty_id ?? "");
        setExtraIds((res.data?.extra_work_ids || []).map(Number));
      } catch (err) {
        toast.error(err.userMessage);
      } finally {
        setLoading(false);
      }
    })();
  }, [doctor.id]);

  // extras = treatments of OTHER specialties (own specialty and "any" are already allowed)
  const extraChoices = specialtyId
    ? works.filter((w) => w.is_active && w.specialty_id != null && Number(w.specialty_id) !== Number(specialtyId))
    : [];
  const specialtyName = (id) => specialties.find((s) => Number(s.id) === Number(id))?.name || "";

  const toggle = (id) => setExtraIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const save = async () => {
    setSaving(true);
    try {
      const choiceIds = new Set(extraChoices.map((w) => Number(w.id)));
      await saveDoctorSettings(doctor.id, {
        specialty_id: specialtyId ? Number(specialtyId) : null,
        // only keep ticks that still make sense for the chosen specialty
        extra_work_ids: extraIds.filter((id) => choiceIds.has(id)),
      });
      toast.success(t("spec.saved_ok"));
      onSaved();
    } catch (err) {
      toast.error(err.userMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-pop sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">{doctor.full_name}</h2>
        {loading ? (
          <p className="py-6 text-center text-sm text-slate-500">{t("clin.loading")}</p>
        ) : (
          <>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">{t("spec.specialty")}</label>
              <select value={specialtyId} onChange={(e) => setSpecialtyId(e.target.value)} className={inputCls}>
                <option value="">{t("spec.no_specialty")}</option>
                {specialties.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {!specialtyId && <p className="text-xs text-slate-500">{t("spec.no_specialty_hint")}</p>}
            </div>

            {specialtyId && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-700">{t("spec.extra_works")}</p>
                <p className="text-xs text-slate-500">{t("spec.extra_works_hint")}</p>
                {extraChoices.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">{t("spec.no_extra_choices")}</p>
                ) : (
                  <div className="max-h-60 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
                    {extraChoices.map((w) => (
                      <label key={w.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                        <span className="flex items-center gap-2">
                          <input type="checkbox" checked={extraIds.includes(Number(w.id))} onChange={() => toggle(Number(w.id))} className="h-4 w-4 accent-brand" />
                          {w.name}
                        </span>
                        <span className="text-xs text-slate-400">{specialtyName(w.specialty_id)}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" onClick={onClose} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{t("common.cancel")}</button>
          <button type="button" onClick={save} disabled={loading || saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
            {saving ? t("clin.saving") : t("clin.save_changes")}
          </button>
        </div>
      </div>
    </div>
  );
}

// Settings → Works: the specialty list and each doctor's specialty / extras
export default function SpecialtiesSection({ specialties, works, onSpecialtiesChanged }) {
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState([]);
  const [editSpecialty, setEditSpecialty] = useState(null); // {} = new, object = edit
  const [editDoctor, setEditDoctor] = useState(null);

  const loadDoctors = useCallback(async () => {
    try {
      const res = await getAllDoctors();
      setDoctors(Array.isArray(res.data) ? res.data : []);
    } catch {
      setDoctors([]); // a branch without doctors returns 404
    }
  }, []);

  useEffect(() => {
    let alive = true;
    getAllDoctors()
      .then((res) => { if (alive) setDoctors(Array.isArray(res.data) ? res.data : []); })
      .catch(() => { /* a branch without doctors returns 404 → keep the empty list */ });
    return () => { alive = false; };
  }, []);

  const removeSpecialty = async (s) => {
    if (!window.confirm(t("spec.delete_confirm", { name: s.name }))) return;
    try {
      await deleteSpecialty(s.id);
      onSpecialtiesChanged();
    } catch (err) {
      toast.error(err.userMessage);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
      {/* Specialties */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-slate-900">{t("spec.title")}</h2>
            <p className="mt-0.5 text-sm text-slate-500">{t("spec.subtitle")}</p>
          </div>
          <button type="button" onClick={() => setEditSpecialty({})}
            className="inline-flex items-center rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark shrink-0">{t("spec.add_btn")}</button>
        </div>
        {specialties.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">{t("spec.none")}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {specialties.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                <span className="min-w-0 font-medium text-slate-900">
                  {s.name}
                  {s.uses_teeth && <span className="ms-2 inline-flex items-center rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">{t("spec.teeth_badge")}</span>}
                </span>
                <span className="flex shrink-0 gap-1.5">
                  <button type="button" onClick={() => setEditSpecialty(s)} className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">{t("common.edit")}</button>
                  <button type="button" onClick={() => removeSpecialty(s)} className="inline-flex items-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50">{t("common.delete")}</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Doctors */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
        <div className="mb-3">
          <h2 className="text-[15px] font-semibold text-slate-900">{t("spec.doctors_title")}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{t("spec.doctors_subtitle")}</p>
        </div>
        {doctors.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">{t("spec.no_doctors")}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {doctors.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="font-medium text-slate-900">{d.full_name}</span>
                  <span className="ms-2 text-xs text-slate-500">{d.specialty_name || t("spec.no_specialty")}</span>
                </span>
                <button type="button" onClick={() => setEditDoctor(d)} className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">{t("common.edit")}</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editSpecialty && (
        <SpecialtyFormModal
          initial={editSpecialty.id ? editSpecialty : null}
          onClose={() => setEditSpecialty(null)}
          onSaved={() => { setEditSpecialty(null); onSpecialtiesChanged(); loadDoctors(); }}
        />
      )}

      {editDoctor && (
        <DoctorSettingsModal
          doctor={editDoctor}
          specialties={specialties}
          works={works}
          onClose={() => setEditDoctor(null)}
          onSaved={() => { setEditDoctor(null); loadDoctors(); }}
        />
      )}
    </div>
  );
}
