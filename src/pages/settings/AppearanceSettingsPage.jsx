import { useTranslation } from "react-i18next";
import AppearanceCard from "../../components/AppearanceCard";

// Minimal settings page for roles that only need theme + language (reception, doctor).
export default function AppearanceSettingsPage() {
    const { t } = useTranslation();
    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">{t('settings.title')}</h2>
            <AppearanceCard />
        </div>
    );
}
