import { Outlet } from "react-router-dom";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import BranchSwitcher from "../components/BranchSwitcher";
import NotificationBell from "../components/NotificationBell";
import TopNav from "../components/TopNav";
import { clearStorageKeepingTheme } from "../utils/theme";

export default function DoctorLayout() {
  const { t } = useTranslation();
  const name = localStorage.getItem('name');

  const handleLogout = () => {
    if (window.confirm(t('layout.logout_confirm'))) {
      clearStorageKeepingTheme(); // keeps dark/light preference
      window.location.href = "/";
    }
  };

  const navItems = useMemo(() => {
    const raw = [
      { labelKey: "nav.dashboard", path: "/doctor", end: true },
      { labelKey: "nav.appts_per_doc", path: "/doctor/appts_per_doc" },
      { labelKey: "nav.calendar", path: "/doctor/calendar" },
      { labelKey: "nav.reports", path: "/doctor/report" },
      { labelKey: "nav.lab", path: "/doctor/lab" },
      { labelKey: "nav.settings", path: "/doctor/settings" },
    ];
    return raw.map((it) => ({ key: it.path, to: it.path, end: it.end, label: t(it.labelKey) }));
  }, [t]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900">
      <TopNav
        items={navItems}
        title="Crown Dental Clinic"
        subtitle={t('layout.dr_dashboard', { name })}
        onLogout={handleLogout}
        logoutLabel={t('nav.logout')}
        rightExtras={<NotificationBell />}
        switcher={<BranchSwitcher />}
      />

      <div className="flex-1 overflow-y-auto">
        <main className="mx-auto w-full max-w-[1400px] px-4 py-5 md:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
