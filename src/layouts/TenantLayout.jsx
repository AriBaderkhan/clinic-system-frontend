import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import BranchSwitcher from "../components/BranchSwitcher";
import SubscriptionBanner from "../components/SubscriptionBanner";
import NotificationBell from "../components/NotificationBell";
import InsightsAssistant from "../components/insights/InsightsAssistant";
import TopNav from "../components/TopNav";
import { useSubscription } from "../context/SubscriptionContext";
import { clearStorageKeepingTheme } from "../utils/theme";

const navItems = [
    { labelKey: "nav.dashboard", path: "", end: true },
    { labelKey: "nav.branches", path: "branches" },
    { labelKey: "nav.users", path: "users" },
    { labelKey: "nav.reports", path: "reports" },
    { labelKey: "nav.feedback_results", path: "feedback", feature: "reminders" },
    { labelKey: "nav.activity_log", path: "audit", feature: "audit_log" },
    { labelKey: "nav.settings", path: "settings" },
];

export default function TenantLayout() {
    const { hasFeature } = useSubscription();
    const { t } = useTranslation();

    // Hide nav items whose plan feature isn't included (e.g. Activity Log → Pro).
    const visibleNav = navItems
        .filter((item) => !item.feature || hasFeature(item.feature))
        .map((it) => ({ key: it.path || "home", to: it.path, end: it.end, label: t(it.labelKey) }));

    const handleLogout = () => {
        if (window.confirm(t('layout.logout_confirm'))) {
            clearStorageKeepingTheme(); // keeps dark/light preference
            window.location.href = "/";
        }
    };

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900">
            <TopNav
                items={visibleNav}
                title={t('layout.tenant_manager')}
                subtitle={t('layout.organization_admin')}
                onLogout={handleLogout}
                logoutLabel={t('nav.logout')}
                rightExtras={<NotificationBell />}
                switcher={<BranchSwitcher />}
            />

            <div className="flex-1 overflow-y-auto">
                <main className="mx-auto w-full max-w-[1400px] px-4 py-5 md:px-6">
                    <SubscriptionBanner />
                    <Outlet />
                </main>
            </div>

            {/* Insights Assistant — only when the plan includes it (Pro). */}
            {hasFeature("insights_assistant") && <InsightsAssistant />}
        </div>
    );
}
