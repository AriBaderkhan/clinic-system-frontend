import { NavLink, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { connectSocket, disconnectSocket } from "../realtime/socket";
import toast from "react-hot-toast";
import notify from '../assets/notify.mp3'
import BranchSwitcher from "../components/BranchSwitcher";
import ProfileMenu from "../components/ProfileMenu";
import AnnouncementsBell from "../components/AnnouncementsBell";
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
  const [open, setOpen] = useState(false);
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
  const navItems = getNavItems().filter((item) => !item.feature || hasFeature(item.feature));

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

  const navLinkClass = (indent) => ({ isActive }) =>
    [
      "flex items-center gap-2 rounded-lg transition",
      indent ? "py-1.5 ps-9 pe-3 text-[13px]" : "py-2 px-3",
      "text-slate-200 hover:bg-[#6a87ad] hover:text-white",
      "border-s-4 border-transparent",
      isActive ? "bg-[#6a87ad] border-s-[#015478] text-[#015478]" : "",
    ].filter(Boolean).join(" ");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* ===== Mobile overlay ===== */}
      <div
        className={[
          "fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={() => setOpen(false)}
      />

      {/* ===== Mobile drawer ===== */}
      <aside
        className={[
          "fixed start-0 top-0 z-50 h-full w-72 bg-[#7b97bd] text-slate-100",
          "transform transition-transform md:hidden",
          open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-[#6a87ad] px-5 py-4">
          <div className="flex items-center gap-3">
            <ProfileMenu />
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">Crown Dental Clinic</span>
              <span className="text-[11px] text-white">{t('layout.reception_dashboard')}</span>
            </div>
            <div className="ms-auto"><AnnouncementsBell /></div>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="rounded-md px-2 py-1 text-slate-200 hover:bg-[#6a87ad]"
            aria-label={t('layout.close_menu')}
          >
            ✕
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4 text-sm">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.end} onClick={() => setOpen(false)} className={navLinkClass(item.indent)}>
              <span>{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[#6a87ad] px-3 py-3">
          <BranchSwitcher />
          <button
            onClick={() => { handleLogout(); setOpen(false); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-900 transition hover:bg-black/10 hover:text-black"
          >
            <span>{t('nav.logout')}</span>
          </button>
        </div>

        <div className="border-t border-[#6a87ad] px-5 py-3 text-[11px] text-slate-900">
          {t('layout.powered_by')} <span className="text-white">Tradi Company</span>
        </div>
      </aside>

      {/* ===== Desktop sidebar ===== */}
      <aside className="hidden w-64 flex-col border-e bg-[#7b97bd] text-slate-100 md:flex h-screen sticky top-0 shrink-0">
        <div className="flex items-center gap-3 border-b border-[#6a87ad] px-5 py-4">
          <ProfileMenu />
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight">Crown Dental Clinic</span>
            <span className="text-[11px] text-white">{t('layout.reception_dashboard')}</span>
          </div>
          <div className="ms-auto"><AnnouncementsBell /></div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4 text-sm">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.end} className={navLinkClass(item.indent)}>
              <span>{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[#6a87ad] px-3 py-3">
          <BranchSwitcher />
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-900 transition hover:bg-black/10 hover:text-black"
          >
            <span>{t('nav.logout')}</span>
          </button>
        </div>

        <div className="border-t border-[#6a87ad] px-5 py-3 text-[11px] text-slate-900">
          {t('layout.powered_by')} <span className="text-white">Tradi Company</span>
        </div>
      </aside>

      {/* ===== Main area ===== */}
      <div id="main-scroll" className="flex flex-1 flex-col overflow-y-auto">
        <button
          className="fixed top-3 start-3 z-30 rounded-md bg-[#7b97bd] px-3 py-2 text-white shadow md:hidden"
          onClick={() => setOpen(true)}
          aria-label={t('layout.open_menu')}
        >
          ☰
        </button>

        <main className="flex-1 px-4 pt-14 pb-4 md:px-6 md:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
