import { Outlet } from "react-router-dom";
import TopNav from "../components/TopNav";
import { PageBandContext, usePageBandSlot } from "../components/common/PageHeader";
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
    const band = usePageBandSlot();
    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            clearStorageKeepingTheme(); // keeps dark/light preference
            window.location.href = "/";
        }
    };

    return (
        <PageBandContext.Provider value={band.value}>
        <div className="flex h-screen flex-col overflow-hidden bg-ground text-slate-900">
            <TopNav
                items={navItems}
                title="Platform Admin"
                subtitle="System Administrator"
                onLogout={handleLogout}
                logoutLabel="Log out"
            />

            <div id="main-scroll" className="flex-1 overflow-y-auto">
                <main>
                    <div className={`ocean-band band-dark ${band.active ? "" : "hidden"}`}>
                        <div className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-5 md:px-6">
                            <div ref={band.ref} />
                            <div ref={band.tabsRef} className="mt-4 empty:hidden" />
                        </div>
                    </div>
                    <div className={`relative mx-auto w-full max-w-[1400px] px-4 pb-10 md:px-6 ${band.active ? "-mt-11" : "pt-5"}`}>
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
        </PageBandContext.Provider>
    );
}
