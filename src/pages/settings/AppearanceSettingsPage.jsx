import { useTranslation } from "react-i18next";
import AppearanceCard from "../../components/AppearanceCard";
import PageHeader from "../../components/common/PageHeader";

// Minimal settings page for roles that only need theme + language (reception, doctor).
export default function AppearanceSettingsPage() {
    const { t } = useTranslation();
    return (
        <div className="w-full space-y-5">
            <PageHeader title={t('settings.title')} />
            <AppearanceCard />
        </div>
    );
}
