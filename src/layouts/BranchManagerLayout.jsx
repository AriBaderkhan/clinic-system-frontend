import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { connectSocket, disconnectSocket } from "../realtime/socket";
import toast from "react-hot-toast";
import notify from '../assets/notify.mp3'
import BranchSwitcher from "../components/BranchSwitcher";
import SubscriptionBanner from "../components/SubscriptionBanner";
import NotificationBell from "../components/NotificationBell";
import TopNav from "../components/TopNav";
import { useSubscription } from "../context/SubscriptionContext";
import { clearStorageKeepingTheme } from "../utils/theme";

// `feature` items are hidden unless the tenant's plan includes that feature code.
const navItems = [
  { labelKey: "nav.dashboard", path: "", end: true },
  { labelKey: "nav.patients", path: "patients" },
  { labelKey: "nav.appointments", path: "appointments", end: true },
  { labelKey: "nav.calendar", path: "appointments/calendar", indent: true },
  { labelKey: "nav.reminders", path: "appointments/reminders", indent: true, feature: "reminders" },
  { labelKey: "nav.feedback", path: "appointments/feedback", indent: true, feature: "reminders" },
  { labelKey: "nav.sessions", path: "sessions" },
  { labelKey: "nav.lab", path: "lab" },
  { labelKey: "nav.reports", path: "reports" },
  { labelKey: "nav.branch_settings", path: "settings/branch" },
];

export default function BranchManagerLayout() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { hasFeature } = useSubscription();
  const isTenantViewing = !!localStorage.getItem('tenant_token');

  const handleLogout = () => {
    if (window.confirm(t('layout.logout_confirm'))) {
      clearStorageKeepingTheme(); // keeps dark/light preference
      disconnectSocket();
      window.location.href = "/";
    }
  };

  // hide nav items whose feature the plan doesn't include
  const visibleNav = navItems
    .filter((item) => !item.feature || hasFeature(item.feature))
    .map((it) => ({ key: it.path || "home", to: it.path, end: it.end, indent: it.indent, label: t(it.labelKey) }));

  const handleBackToTenant = () => {
    localStorage.setItem('token', localStorage.getItem('tenant_token'));
    localStorage.removeItem('tenant_token');
    navigate('/tenant/branches');
  };

  useEffect(() => {
    const socket = connectSocket();

    const onApptCompleted = (payload) => {
      const audio = new Audio(notify);
      audio.volume = 1;

      audio.play().catch(() => { }); // play sound

      toast((to) => (
        <div
          style={{ cursor: "pointer" }}
          onClick={() => {
            audio.pause();
            audio.currentTime = 0;
            toast.dismiss(to.id);
          }}
        >
          <div>{payload?.message}</div>
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
            {t('layout.click_stop_sound')}
          </div>
        </div>
      ), {
        duration: Infinity, // stays until click
        id: "appt_completed_click_stop", // no duplicates
      });
    }

    socket.on('appointment_completed', onApptCompleted);

    return () => {
      socket.off("appointment_completed", onApptCompleted);
    }
  }, [t]);

  const backToTenantBtn = isTenantViewing ? (
    <button
      onClick={handleBackToTenant}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#0E6E75] transition hover:bg-[#0E6E75]/10"
    >
      <span>← {t('layout.back_to_tenant')}</span>
    </button>
  ) : null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900">
      <TopNav
        items={visibleNav}
        title="Crown Dental Clinic"
        subtitle={t('layout.branch_manager')}
        onLogout={handleLogout}
        logoutLabel={t('nav.logout')}
        rightExtras={<NotificationBell />}
        switcher={<BranchSwitcher />}
        beforeLogout={backToTenantBtn}
      />

      <div id="main-scroll" className="flex-1 overflow-y-auto">
        <main className="mx-auto w-full max-w-[1400px] px-4 py-5 md:px-6">
          <SubscriptionBanner />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
