import { useTranslation } from "react-i18next";

// Monthly | Yearly switch, shared by registration, renewal and admin add-clinic.
export default function BillingPeriodToggle({ value, onChange }) {
    const { t } = useTranslation();
    const options = [
        { key: "monthly", label: t("billing.monthly") },
        { key: "yearly", label: t("billing.yearly") },
    ];

    return (
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
            {options.map((o) => (
                <button
                    key={o.key}
                    type="button"
                    onClick={() => onChange(o.key)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${value === o.key ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-50"}`}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}
