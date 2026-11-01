import { useTranslation } from "react-i18next";

// Floor dropdown for appointment lists ("All floors" + each floor).
// Renders nothing when the branch has one floor.
export default function FloorFilter({ floors, value, onChange, show, withLabel = true }) {
  const { t } = useTranslation();
  if (!show) return null;
  return (
    <div className="flex flex-col gap-1.5">
      {withLabel && <label className="text-xs font-semibold text-[#0E6E75]">{t("floor.floor")}</label>}
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        aria-label={t("floor.floor")}
        className="rounded-xl border border-[#0E6E75]/20 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:border-[#0E6E75] focus:outline-none focus:ring-2 focus:ring-[#0E6E75]/20"
      >
        <option value="">{t("floor.all_floors")}</option>
        {floors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
      </select>
    </div>
  );
}
