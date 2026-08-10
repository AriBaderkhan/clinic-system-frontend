import { Outlet } from "react-router-dom";
import TopNav from "../components/TopNav";
import { clearStorageKeepingTheme } from "../utils/theme";

const navItems = [
    { key: "home", to: "", end: true, label: "Dashboard" },
    { key: "plans", to: "plans", label: "Plans" },
    { key: "features", to: "features", label: "Features" },
    { key: "subscriptions", to: "subscriptions", label: "Subscriptions" },
    { key: "registrations", to: "registrations", label: "Registrations" },
    { key: "announcements", to: "announcements", label: "Announcements" },
];

export default function AdminLayout() {
    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            clearStorageKeepingTheme(); // keeps dark/light preference
            window.location.href = "/";
        }
    };

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900">
            <TopNav
                items={navItems}
                title="Platform Admin"
                subtitle="System Administrator"
                onLogout={handleLogout}
                logoutLabel="Log out"
            />

            <div className="flex-1 overflow-y-auto">
                <main className="mx-auto w-full max-w-[1400px] px-4 py-5 md:px-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
