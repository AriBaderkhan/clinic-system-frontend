import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { disconnectSocket } from "../realtime/socket";
import BranchSwitcher from "../components/BranchSwitcher";
import NotificationBell from "../components/NotificationBell";
import TopNav from "../components/TopNav";
import { useSubscription } from "../context/SubscriptionContext";
import { clearStorageKeepingTheme } from "../utils/theme";

// Helper to check permission safely
const hasPermission = (permission) => {
  const userString = localStorage.getItem("user");
  if (!userString) return false;
  try {
    const user = JSON.parse(userString);
    return user.permissions?.includes(permission);
  } catch (e) {
    return false;
  }
};

const getNavItems = () => {
  const items = [
    { labelKey: "nav.dashboard", path: "", end: true },
    { labelKey: "nav.patients", path: "patients", permission: "view_patient" },
    { labelKey: "nav.appointments", path: "appointments", permission: "view_appointment", end: true },
    { labelKey: "nav.calendar", path: "appointments/calendar", permission: "view_appointment", indent: true },
    { labelKey: "nav.reminders", path: "appointments/reminders", permission: "send_reminders", indent: true, feature: "reminders" },
    { labelKey: "nav.feedback", path: "appointments/feedback", permission: "send_reminders", indent: true, feature: "reminders" },
    { labelKey: "nav.sessions", path: "sessions", permission: "view_session" },
    { labelKey: "nav.lab", path: "lab", permission: "manage_lab" },
    { labelKey: "nav.reports", path: "reports", permission: "view_reports" },
    { labelKey: "nav.branch_settings", path: "settings/branch", permission: "manage_branch_settings" },
    { labelKey: "nav.settings", path: "settings" },
  ];

  return items.filter(item => !item.permission || hasPermission(item.permission));
};

export default function ReceptionLayout() {
  const { t } = useTranslation();
  const { hasFeature } = useSubscription();

  const handleLogout = () => {
    if (window.confirm(t('layout.logout_confirm'))) {
      clearStorageKeepingTheme(); // keeps dark/light preference
      disconnectSocket();
      window.location.href = "/";
    }
  };

  // permission-filtered items, then hide any whose plan feature isn't included
  const navItems = getNavItems()
    .filter((item) => !item.feature || hasFeature(item.feature))
    .map((it) => ({ key: it.path || "home", to: it.path, end: it.end, indent: it.indent, label: t(it.labelKey) }));

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900">
      <TopNav
        items={navItems}
        title="Crown Dental Clinic"
        subtitle={t('layout.reception_dashboard')}
        onLogout={handleLogout}
        logoutLabel={t('nav.logout')}
        rightExtras={<NotificationBell />}
        switcher={<BranchSwitcher />}
      />

      <div id="main-scroll" className="flex-1 overflow-y-auto">
        <main className="mx-auto w-full max-w-[1400px] px-4 py-5 md:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
