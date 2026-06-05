import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from 'react-hot-toast';

const navItems = [
    { label: "Dashboard", path: "" }, // /admin (Tenants List)
    { label: "Plans", path: "plans" },
    { label: "Features", path: "features" },
    // { label: "Subscriptions", path: "subscriptions" }, // Optional
];

export default function AdminLayout() {
    const navigate = useNavigate();

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            localStorage.clear();
            window.location.href = "/";
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
            {/* Sidebar for Platform Admin */}
            <aside className="hidden w-64 flex-col border-r bg-[#7b97bd] text-slate-100 md:flex h-screen sticky top-0 shrink-0">
                <div className="flex items-center gap-3 border-b border-[#6a87ad] px-5 py-4">
                    {/* Admin Logo Placeholder */}
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#015478] text-xs font-semibold text-white">
                        XA
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold tracking-tight">Platform Admin</span>
                        <span className="text-[11px] text-white/70">System Administrator</span>
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
                                    "transition text-slate-200 hover:bg-[#6a87ad] hover:text-white hover:pl-3.5",
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

                <div className="border-t border-[#6a87ad] px-3 py-3">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-900 transition hover:bg-black/10 hover:text-black"
                    >
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-y-auto">
                <main className="flex-1 px-4 py-4 md:px-6 md:py-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
