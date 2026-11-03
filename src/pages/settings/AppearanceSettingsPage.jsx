import { useTranslation } from "react-i18next";
import { FiFeather, FiMonitor } from "react-icons/fi";
import AppearanceCard from "../../components/AppearanceCard";
import PageHeader from "../../components/common/PageHeader";
import DesignPage from "./DesignPage";
import SettingsShell from "../../components/settings/SettingsShell";

// Settings page for roles that only need their own look + language (reception, doctor, ...).
export default function AppearanceSettingsPage() {
    const { t } = useTranslation();
    const groups = [
        {
            label: t('settings.group_you'),
            items: [
                { key: 'design', label: t('design.title'), icon: FiFeather, content: <DesignPage /> },
                { key: 'display', label: t('settings.menu_display'), icon: FiMonitor, content: <AppearanceCard /> },
            ],
        },
    ];
    return (
        <div className="w-full space-y-5">
            <PageHeader title={t('settings.title')} />
            <SettingsShell groups={groups} />
        </div>
    );
}
