import { useTranslation } from "react-i18next";
import { LANGUAGES } from "../i18n/languages";
import { changeLanguage } from "../i18n";

// Small dropdown to switch the whole app's language (and direction).
export default function LanguageSwitcher({ className = "" }) {
    const { i18n } = useTranslation();
    return (
        <select
            value={i18n.language}
            onChange={(e) => changeLanguage(e.target.value)}
            aria-label="Language"
            className={`rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 ${className}`}
        >
            {Object.entries(LANGUAGES).map(([code, cfg]) => (
                <option key={code} value={code}>
                    {cfg.label}
                </option>
            ))}
        </select>
    );
}
