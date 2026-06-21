import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { connectSocket, disconnectSocket } from "../realtime/socket";
import toast from "react-hot-toast";
import notify from '../assets/notify.mp3'
import BranchSwitcher from "../components/BranchSwitcher";
import { clearStorageKeepingTheme } from "../utils/theme";

const navItems = [
  { label: "Dashboard", path: "", end: true },
  { label: "Patients", path: "patients" },
  { label: "Appointments", path: "appointments", end: true },
  { label: "Calendar", path: "appointments/calendar", indent: true },
  { label: "Reminders", path: "appointments/reminders", indent: true },
  { label: "Sessions", path: "sessions" },
  { label: "Lab", path: "lab" },
  // { label: "History", path: "history" },
  { label: "Reports", path: "reports" },
  { label: "Works", path: "works" },
  { label: "Branch Settings", path: "settings/branch" },
];

// const name = localStorage.getItem('name')
const handleLogout = () => {
  if (window.confirm('Are you sure you want to logout?')) {
    clearStorageKeepingTheme(); // keeps dark/light preference
    disconnectSocket();
    window.location.href = "/";
  }
};

export default function BranchManagerLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const isTenantViewing = !!localStorage.getItem('tenant_token');

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

      toast((t) => (
        <div
          style={{ cursor: "pointer" }}
          onClick={() => {
            audio.pause();
            audio.currentTime = 0;
            toast.dismiss(t.id);
          }}
        >
          <div>{payload?.message}</div>
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
            Click to stop sound
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
  }, []);

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
          "fixed left-0 top-0 z-50 h-full w-72 bg-[#7b97bd] text-slate-100",
          "transform transition-transform md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-[#6a87ad] px-5 py-4">
          <div className="flex items-center gap-3">
            <img src="../img/crown.jpg" alt="" className="flex h-9 w-9 items-center justify-center rounded-full" />

            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">Crown Dental Clinic</span>
              <span className="text-[11px] text-white">Branch Manager</span>
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="rounded-md px-2 py-1 text-slate-200 hover:bg-[#6a87ad]"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                [
                  "flex items-center gap-2 rounded-lg transition",
                  item.indent ? "py-1.5 pl-9 pr-3 text-[13px]" : "py-2 px-3",
                  "text-slate-200 hover:bg-[#6a87ad] hover:text-white",
                  "border-l-4 border-transparent",
                  isActive ? "bg-[#6a87ad] border-l-[#015478] text-[#015478]" : "",
                ]
                  .filter(Boolean)
                  .join(" ")
              }
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[#6a87ad] px-3 py-3 flex flex-col gap-1">
          {isTenantViewing && (
            <button
              onClick={() => { handleBackToTenant(); setOpen(false); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#015478] transition hover:bg-[#015478]/10 hover:text-blue-300"
            >
              <span>← Back to Tenant</span>
            </button>
          )}
          <BranchSwitcher />
          <button
            onClick={() => {
              handleLogout();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-900 transition hover:bg-black/10 hover:text-black"
          >
            <span>Logout</span>
          </button>
        </div>


        <div className="border-t border-[#6a87ad] px-5 py-3 text-[11px] text-slate-900">
          Powered By <span className="text-white">Tradi Company</span>
        </div>
      </aside>

      {/* ===== Desktop sidebar ===== */}
      <aside className="hidden w-64 flex-col border-r bg-[#7b97bd] text-slate-100 md:flex h-screen sticky top-0 shrink-0">
        <div className="flex items-center gap-3 border-b border-[#6a87ad] px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#015478] text-xs font-semibold text-white">
            CD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight">Crown Dental Clinic</span>
            <span className="text-[11px] text-white">Branch Manager</span>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                [
                  "flex items-center gap-2 rounded-lg transition",
                  item.indent ? "py-1.5 pl-9 pr-3 text-[13px]" : "py-2 px-3",
                  "text-slate-200 hover:bg-[#6a87ad] hover:text-white",
                  "border-l-4 border-transparent",
                  isActive ? "bg-[#6a87ad] border-l-[#015478] text-[#015478]" : "",
                ]
                  .filter(Boolean)
                  .join(" ")
              }
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[#6a87ad] px-3 py-3 flex flex-col gap-1">
          {isTenantViewing && (
            <button
              onClick={handleBackToTenant}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#015478] transition hover:bg-[#015478]/10 hover:text-blue-300"
            >
              <span>← Back to Tenant</span>
            </button>
          )}
          <BranchSwitcher />
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-900 transition hover:bg-black/10 hover:text-black"
          >
            <span>Logout</span>
          </button>
        </div>

        <div className="border-t border-[#6a87ad] px-5 py-3 text-[11px] text-slate-900">
          Powered By <span className="text-white">Tradi Company</span>
        </div>



      </aside>

      {/* ===== Main area ===== */}
      <div id="main-scroll" className="flex flex-1 flex-col overflow-y-auto">
          {/* Mobile hamburger — no header bar, just floating button */}
          <button
            className="fixed top-3 left-3 z-30 rounded-md bg-[#7b97bd] px-3 py-2 text-white shadow md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>

        <main className="flex-1 overflow-y-auto px-4 pt-14 pb-4 md:px-6 md:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );

}

