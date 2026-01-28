
// src/layouts/DoctorLayout.jsx
import { NavLink, Outlet } from "react-router-dom";
import { useMemo, useState } from "react";

export default function DoctorLayout() {
  const [open, setOpen] = useState(false);
  const role = localStorage.getItem("role");

  const name = localStorage.getItem('name')
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.clear(); // or removeItem("token"), removeItem("role")
      window.location.href = "/";
    }
  };

  const navItems = useMemo(() => {
    return [
      { label: "Dashboard", path: "/doctor", end: true },
      { label: "Appointments", path: "/doctor/appts_per_doc" },
      ...(role === "super_doctor" ? [{ label: "Reports", path: "/doctor/reports" }] : []),
    ];
  }, [role]);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
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
          "fixed left-0 top-0 z-50 h-full w-72 bg-slate-900 text-slate-100",
          "transform transition-transform md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1DB954] text-xs font-semibold text-white">
              CD
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">Crown Dental Clinic</span>
              <span className="text-[11px] text-slate-400">Doctor Dashboard</span>
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="rounded-md px-2 py-1 text-slate-200 hover:bg-slate-800"
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
                  "flex items-center gap-2 rounded-lg px-3 py-2",
                  "transition text-slate-200 hover:bg-slate-800 hover:text-white hover:pl-3.5",
                  "border-l-4 border-transparent",
                  isActive ? "bg-slate-800 border-l-[#1DB954] text-[#1DB954]" : "",
                ]
                  .filter(Boolean)
                  .join(" ")
              }
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 px-3 py-3">
          <button
            onClick={() => {
              handleLogout();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-500"
          >
            <span>Logout</span>
          </button>
        </div>
        <div className="border-t border-slate-800 px-5 py-3 text-[11px] text-slate-500">
          Powered By <span className="text-slate-200">Tradi Company</span>
        </div>
      </aside>

      {/* ===== Desktop sidebar ===== */}
      <aside className="hidden w-64 flex-col border-r bg-slate-900 text-slate-100 md:flex">
        <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1DB954] text-xs font-semibold text-white">
            CD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight">Crown Dental Clinic</span>
            <span className="text-[11px] text-slate-400">Dr.{name} Dashboard</span>
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
                  "flex items-center gap-2 rounded-lg px-3 py-2",
                  "transition text-slate-200 hover:bg-slate-800 hover:text-white hover:pl-3.5",
                  "border-l-4 border-transparent",
                  isActive ? "bg-slate-800 border-l-[#1DB954] text-[#1DB954]" : "",
                ]
                  .filter(Boolean)
                  .join(" ")
              }
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-800 px-3 py-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-500"
          >
            <span>Logout</span>
          </button>
        </div>

        <div className="border-t border-slate-800 px-5 py-3 text-[11px] text-slate-500">
          Powered By <span className="text-slate-200">Tradi Company</span>
        </div>
      </aside>

      {/* ===== Main area ===== */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-14 items-center justify-between border-b bg-slate-800 px-4">
          {/* Mobile hamburger */}
          <button
            className="rounded-md px-3 py-2 text-white hover:bg-slate-700 md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>

          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">Dashboard</span>
            <span className="text-[11px] text-slate-400">Doctor overview</span>
          </div>

          {/* spacer to balance header on mobile */}
          <div className="w-[44px] md:hidden" />
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
