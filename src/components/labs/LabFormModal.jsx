import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useWorks from "../../hooks/useWorks";
import { getLabById } from "../../api/labApi";

export default function LabFormModal({ mode = "add", labId, onClose, onSubmit, isSubmitting = false }) {
  const { t } = useTranslation();
  const { works, isLoading: isWorksLoading } = useWorks();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rows, setRows] = useState([{ work_id: "", cost: "" }]);
  const [error, setError] = useState("");
  const [isLoadingLab, setIsLoadingLab] = useState(mode === "edit");

  // edit mode: load the lab with its price list
  useEffect(() => {
    if (mode !== "edit" || !labId) return;
    (async () => {
      try {
        setIsLoadingLab(true);
        const res = await getLabById(labId);
        const lab = res.data;
        setName(lab.name || "");
        setPhone(lab.phone || "");
        setRows(
          lab.treatments?.length > 0
            ? lab.treatments.map((tr) => ({ work_id: String(tr.work_id), cost: String(tr.cost) }))
            : [{ work_id: "", cost: "" }]
        );
      } catch (err) {
        setError(err.userMessage || t("labm.could_not_load_lab"));
      } finally {
        setIsLoadingLab(false);
      }
    })();
  }, [mode, labId]);

  const updateRow = (idx, field, value) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, { work_id: "", cost: "" }]);

  const removeRow = (idx) => {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  // works already used in other rows can't be picked twice
  const usedWorkIds = rows.map((r) => r.work_id).filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || name.trim().length < 2) {
      setError(t("labm.name_required"));
      return;
    }

    const treatments = [];
    for (const r of rows) {
      if (!r.work_id || r.cost === "") {
        setError(t("labm.row_needs_cost"));
        return;
      }
      if (Number(r.cost) < 0) {
        setError(t("labm.cost_negative"));
        return;
      }
      treatments.push({ work_id: Number(r.work_id), cost: Number(r.cost) });
    }

    if (treatments.length === 0) {
      setError(t("labm.add_one_treatment_cost"));
      return;
    }

    await onSubmit({ name: name.trim(), phone: phone.trim() || null, treatments });
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-pop sm:p-6">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">
              {mode === "add" ? t("labm.add_lab") : t("labm.edit_lab")}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {t("labm.lab_subtitle")}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {isLoadingLab ? (
          <p className="py-6 text-center text-sm text-slate-500">{t("labm.loading_lab")}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Name + Phone */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">{t("labm.lab_name")}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("labm.lab_name_ph")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">{t("labm.phone_optional")}</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("labm.phone_ph")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                />
              </div>
            </div>

            {/* Price list */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("labm.treatments_costs")}
                </p>
                <button
                  type="button"
                  onClick={addRow}
                  className="inline-flex items-center rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark"
                >
                  {t("labm.add_treatment")}
                </button>
              </div>

              {isWorksLoading ? (
                <p className="text-xs text-slate-500">{t("labm.loading_treatments")}</p>
              ) : (
                <div className="space-y-2">
                  {rows.map((row, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-2">
                      <select
                        value={row.work_id}
                        onChange={(e) => updateRow(idx, "work_id", e.target.value)}
                        className="min-w-[160px] flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                      >
                        <option value="">{t("labm.select_treatment")}</option>
                        {works.map((w) => (
                          <option
                            key={w.id}
                            value={String(w.id)}
                            disabled={usedWorkIds.includes(String(w.id)) && row.work_id !== String(w.id)}
                          >
                            {w.name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={row.cost}
                        onChange={(e) => updateRow(idx, "cost", e.target.value)}
                        placeholder={t("labm.cost_ph")}
                        className="w-32 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                      />

                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        disabled={rows.length === 1}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-white text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? t("labm.saving") : mode === "add" ? t("labm.create_lab") : t("labm.save_changes")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
