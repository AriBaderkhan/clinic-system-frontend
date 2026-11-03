import { useTranslation } from "react-i18next";

// Floor dropdown for appointment lists ("All floors" + each floor).
// Renders nothing when the branch has one floor.
export default function FloorFilter({ floors, value, onChange, show, withLabel = true }) {
  const { t } = useTranslation();
  if (!show) return null;
  return (
    <div className="flex flex-col gap-1.5">
      {withLabel && <label className="block text-sm font-medium text-slate-700">{t("floor.floor")}</label>}
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        aria-label={t("floor.floor")}
        className="w-full min-w-[9rem] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
      >
        <option value="">{t("floor.all_floors")}</option>
        {floors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
      </select>
    </div>
  );
}
