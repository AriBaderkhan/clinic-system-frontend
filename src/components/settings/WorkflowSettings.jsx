import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { getWorkflow, updateWorkflow } from "../../api/settingApi";

const SWITCHES = ["allow_settle_unpaid", "allow_discounts", "block_booking_if_owes"];

function Switch({ name, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-switch={name}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${checked ? "bg-[#0E6E75]" : "bg-slate-300"}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${checked ? "translate-x-5 rtl:-translate-x-5" : "translate-x-0.5 rtl:-translate-x-0.5"}`} />
    </button>
  );
}

// The branch's workflow rules: settle, discounts (+ biggest %), booking while the patient owes.
export default function WorkflowSettings() {
  const { t } = useTranslation();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getWorkflow()
      .then((res) => { setForm(res.data); setSaved(res.data); })
      .catch((err) => toast.error(err.userMessage || t("workflow.load_failed")));
  }, []);

  if (!form) return null;

  const pct = Number(form.max_discount_percent);
  const pctOk = Number.isInteger(pct) && pct >= 0 && pct <= 100 && form.max_discount_percent !== "";
  const changed = JSON.stringify(form) !== JSON.stringify(saved);

  const save = async () => {
    if (!pctOk) return toast.error(t("workflow.bad_percent"));
    setSaving(true);
    try {
      const res = await updateWorkflow({
        allow_settle_unpaid: form.allow_settle_unpaid,
        allow_discounts: form.allow_discounts,
        max_discount_percent: pct,
        block_booking_if_owes: form.block_booking_if_owes,
      });
      setForm(res.data);
      setSaved(res.data);
      toast.success(t("workflow.saved"));
    } catch (err) {
      toast.error(err.userMessage || t("workflow.save_failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-lg shadow p-6" data-workflow>
      <h2 className="text-lg font-semibold mb-1 dark:text-slate-100">{t("workflow.title")}</h2>
      <p className="text-sm text-gray-500 mb-4">{t("workflow.hint")}</p>

      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {SWITCHES.map((key) => (
          <div key={key} className="py-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{t(`workflow.${key}`)}</p>
                <p className="text-xs text-slate-500">{t(`workflow.${key}_hint`)}</p>
              </div>
              <Switch name={key} checked={!!form[key]} onChange={(v) => setForm({ ...form, [key]: v })} />
            </div>
            {key === "allow_discounts" && form.allow_discounts && (
              <label className="mt-3 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                {t("workflow.max_discount_percent")}
                <input
                  type="number" min="0" max="100" step="1"
                  data-max-percent
                  value={form.max_discount_percent}
                  onChange={(e) => setForm({ ...form, max_discount_percent: e.target.value })}
                  className={`w-20 rounded border px-2 py-1 text-sm dark:bg-slate-900 ${pctOk ? "border-slate-300" : "border-red-400"}`}
                />
                %
              </label>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={save}
          disabled={!changed || saving}
          data-save-workflow
          className="px-4 py-2 bg-[#0E6E75] text-white rounded hover:bg-[#0A565C] transition disabled:opacity-50"
        >
          {saving ? t("workflow.saving") : t("workflow.save")}
        </button>
      </div>
    </section>
  );
}
