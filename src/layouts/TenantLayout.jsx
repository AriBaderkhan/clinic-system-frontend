import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";

const navItems = [
    { label: "Dashboard", path: "" }, // /tenant
    { label: "Branches", path: "branches" },
    { label: "Settings", path: "settings" },
    { label: "Users", path: "users" },
    { label: "Reports", path: "reports" },
];

export default function TenantLayout() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            localStorage.clear();
            window.location.href = "/";
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900">
            {/* Sidebar for Tenant Admin */}
            <aside className="hidden w-64 flex-col border-r bg-slate-900 text-slate-100 md:flex">
                <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-4">
                    {/* Tenant Logo Placeholder */}
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                        TM
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold tracking-tight">Tenant Manager</span>
                        <span className="text-[11px] text-slate-400">Organization Admin</span>
                    </div>
                </div>

                <nav className="flex flex-1 flex-col gap-1 px-3 py-4 text-sm">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === ""}
                            className={({ isActive }) =>
                                [
                                    "flex items-center gap-2 rounded-lg px-3 py-2",
                                    "transition text-slate-200 hover:bg-slate-800 hover:text-white hover:pl-3.5",
                                    "border-l-4 border-transparent",
                                    isActive ? "bg-slate-800 border-l-blue-500 text-blue-500" : "",
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
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex min-h-screen flex-1 flex-col">
                <header className="flex h-14 items-center justify-between border-b bg-white px-4 shadow-sm">
                    <h1 className="text-sm font-semibold">Tenant Overview</h1>
                </header>
                <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
