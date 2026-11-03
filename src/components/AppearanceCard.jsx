import { useTranslation } from "react-i18next";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";

// Shared "Appearance" card: theme (light/dark) + language. Used by every role's
// settings page so the controls live in one place and stay consistent.
export default function AppearanceCard() {
    const { t } = useTranslation();
    return (
        <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
            <h3 className="text-[15px] font-semibold text-slate-900">{t('settings.appearance')}</h3>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 py-3">
                <span className="text-sm font-medium text-slate-700">{t('settings.theme')}</span>
                <div className="w-44"><ThemeToggle /></div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="text-sm font-medium text-slate-700">{t('settings.language')}</span>
                <LanguageSwitcher />
            </div>
        </div>
    );
}
