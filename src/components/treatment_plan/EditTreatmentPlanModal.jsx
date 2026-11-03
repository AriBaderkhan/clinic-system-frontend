import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { editTreatmentPlan } from "../../api/treatmentPlanApi";

const TYPES = ["ORTHO", "IMPLANT", "RCT", "RE_RCT"];

// Lightweight edit for a single treatment plan (type / agreed total / completed),
// reused inside the patient folder. Calls the same editTreatmentPlan endpoint the
// general Treatment Plans page uses.
export default function EditTreatmentPlanModal({ plan, onClose, onUpdated }) {
  const { t } = useTranslation();
  const [type, setType] = useState(String(plan?.type || "").toUpperCase());
  const [agreedTotal, setAgreedTotal] = useState(String(plan?.agreed_total ?? ""));
  const [isCompleted, setIsCompleted] = useState(!!plan?.is_completed);
  const [saving, setSaving] = useState(false);

  if (!plan) return null;

  const handleSave = async () => {
    const payload = {};
    if (type && type !== String(plan.type || "").toUpperCase()) payload.type = type;

    const agreedNum = Number(String(agreedTotal).replace(/,/g, "").trim());
    if (String(agreedTotal).trim() !== "" && Number.isFinite(agreedNum) && agreedNum !== Number(plan.agreed_total)) {
      payload.agreed_total = agreedNum;
    }
    if (isCompleted !== !!plan.is_completed) payload.is_completed = isCompleted;

    if (Object.keys(payload).length === 0) return onClose();

    try {
      setSaving(true);
      await editTreatmentPlan(plan.id, payload);
      onUpdated?.();
      onClose();
    } catch (err) {
      toast.error(err.userMessage || t("patient_folder.save_failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-pop">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("patient_folder.edit_plan")}</h2>
          <button onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">✕</button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t("patient_folder.col_type")}</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
            >
              {TYPES.map((ty) => (
                <option key={ty} value={ty}>{ty}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t("patient_folder.col_agreed")}</label>
            <input
              type="number"
              min="0"
              value={agreedTotal}
              onChange={(e) => setAgreedTotal(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={isCompleted} onChange={(e) => setIsCompleted(e.target.checked)} className="h-4 w-4 accent-brand" />
            {t("patient_folder.mark_completed")}
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button onClick={onClose} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
