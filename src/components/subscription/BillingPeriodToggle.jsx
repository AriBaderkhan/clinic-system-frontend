import { useTranslation } from "react-i18next";

// Monthly | Yearly switch, shared by registration, renewal and admin add-clinic.
export default function BillingPeriodToggle({ value, onChange }) {
    const { t } = useTranslation();
    const options = [
        { key: "monthly", label: t("billing.monthly") },
        { key: "yearly", label: t("billing.yearly") },
    ];

    return (
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
            {options.map((o) => (
                <button
                    key={o.key}
                    type="button"
                    onClick={() => onChange(o.key)}
                    className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${value === o.key ? "bg-white text-[#0E6E75] shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}
