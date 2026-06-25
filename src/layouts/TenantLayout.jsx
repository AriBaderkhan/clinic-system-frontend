import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import ThemeToggle from "../components/ThemeToggle";
import BranchSwitcher from "../components/BranchSwitcher";
import SubscriptionBanner from "../components/SubscriptionBanner";
import { clearStorageKeepingTheme } from "../utils/theme";

const navItems = [
    { label: "Dashboard", path: "", end: true },
    { label: "Branches", path: "branches" },
    { label: "Settings", path: "settings" },
    { label: "Users", path: "users" },
    { label: "Reports", path: "reports" },
];

export default function TenantLayout() {
    const [open, setOpen] = useState(false);

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            clearStorageKeepingTheme(); // keeps dark/light preference
            window.location.href = "/";
        }
    };

    const navLinkClass = ({ isActive }) =>
        [
            "flex items-center gap-2 rounded-lg px-3 py-2",
            "transition text-slate-200 hover:bg-[#6a87ad] hover:text-white hover:pl-3.5",
            "border-l-4 border-transparent",
            isActive ? "bg-[#6a87ad] border-l-[#015478] text-[#015478]" : "",
        ]
            .filter(Boolean)
            .join(" ");

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
            {/* Mobile overlay */}
            <div
                className={[
                    "fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden",
                    open ? "opacity-100" : "pointer-events-none opacity-0",
                ].join(" ")}
                onClick={() => setOpen(false)}
            />

            {/* Mobile drawer */}
            <aside
                className={[
                    "fixed left-0 top-0 z-50 h-full w-72 bg-[#7b97bd] text-slate-100",
                    "transform transition-transform md:hidden",
                    open ? "translate-x-0" : "-translate-x-full",
                ].join(" ")}
            >
                <div className="flex items-center justify-between border-b border-[#6a87ad] px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#015478] text-xs font-semibold text-white">
                            TM
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold tracking-tight">Tenant Manager</span>
                            <span className="text-[11px] text-white">Organization Admin</span>
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
                            className={navLinkClass}
                        >
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="border-t border-[#6a87ad] px-3 py-3">
                    <BranchSwitcher />
                    <ThemeToggle />
                    <button
                        onClick={() => { handleLogout(); setOpen(false); }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-900 transition hover:bg-black/10 hover:text-black"
                    >
                        Logout
                    </button>
                </div>
                <div className="border-t border-[#6a87ad] px-5 py-3 text-[11px] text-slate-900">
                    Powered By <span className="text-white">Tradi Company</span>
                </div>
            </aside>

            {/* Desktop sidebar */}
            <aside className="hidden w-64 flex-col border-r bg-[#7b97bd] text-slate-100 md:flex h-screen sticky top-0 shrink-0">
                <div className="flex items-center gap-3 border-b border-[#6a87ad] px-5 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#015478] text-xs font-semibold text-white">
                        TM
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold tracking-tight">Tenant Manager</span>
                        <span className="text-[11px] text-white">Organization Admin</span>
                    </div>
                </div>

                <nav className="flex flex-1 flex-col gap-1 px-3 py-4 text-sm">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={navLinkClass}
                        >
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="border-t border-[#6a87ad] px-3 py-3">
                    <BranchSwitcher />
                    <ThemeToggle />
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-900 transition hover:bg-black/10 hover:text-black"
                    >
                        Logout
                    </button>
                </div>
                <div className="border-t border-[#6a87ad] px-5 py-3 text-[11px] text-slate-900">
                    Powered By <span className="text-white">Tradi Company</span>
                </div>
            </aside>

            {/* Main area */}
            <div className="flex flex-1 flex-col overflow-y-auto">
                <button
                    className="fixed top-3 left-3 z-30 rounded-md bg-[#7b97bd] px-3 py-2 text-white shadow md:hidden"
                    onClick={() => setOpen(true)}
                    aria-label="Open menu"
                >
                    ☰
                </button>
                <main className="flex-1 px-4 pt-14 pb-4 md:px-6 md:py-6">
                    <SubscriptionBanner />
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
