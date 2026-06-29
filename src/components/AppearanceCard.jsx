import { useTranslation } from "react-i18next";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";

// Shared "Appearance" card: theme (light/dark) + language. Used by every role's
// settings page so the controls live in one place and stay consistent.
export default function AppearanceCard() {
    const { t } = useTranslation();
    return (
        <div className="bg-white rounded-lg border shadow-sm p-5 max-w-2xl">
            <h3 className="font-semibold text-gray-700 mb-3">{t('settings.appearance')}</h3>
            <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-600">{t('settings.theme')}</span>
                <div className="w-44"><ThemeToggle /></div>
            </div>
            <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">{t('settings.language')}</span>
                <LanguageSwitcher />
            </div>
        </div>
    );
}
