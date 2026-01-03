// src/layouts/ReceptionLayout.jsx
import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { label: "Dashboard", path: "" },
  { label: "Appointments", path: "appointments" },
  { label: "Patients", path: "patients" },
  { label: "History", path: "history" },
  { label: "Reports", path: "reports" },
];

function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-slate-900 text-slate-100 md:flex">
        {/* Logo / Clinic name */}
        <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1DB954] text-xs font-semibold text-white">
            CD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight">
              Crown Dental Clinic
            </span>
            <span className="text-[11px] text-slate-400">
              Admin Dashboard
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                [
                  "flex items-center gap-2 rounded-lg px-3 py-2",
                  "transition text-slate-200 hover:bg-slate-800 hover:text-white hover:pl-3.5",
                  "border-l-4 border-transparent",
                  isActive
                    ? "bg-slate-800 border-l-[#1DB954] text-[#1DB954]"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")
              }
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-slate-800 px-5 py-3 text-[11px] text-slate-500">
          Logged in as <span className="text-slate-200">Admin</span>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-14 items-center justify-between border-b bg-slate-800 px-4 shadow-sm backdrop-blur">
          {/* Left: page title */}
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">
              Dashboard
            </span>
            <span className="text-[11px] text-slate-400">
              Overview of Crown Dental Clinic
            </span>
          </div>

          {/* Right: user info */}
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-xs sm:block">
              <div className="font-medium text-white">Admin User</div>
              <div className="text-slate-400">admin@clinic.com</div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1DB954] text-xs font-semibold text-white">
              A
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
