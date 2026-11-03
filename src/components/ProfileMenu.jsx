import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { clearStorageOnLogout } from "../utils/theme";

function initialsOf(name) {
    if (!name) return "U";
    return (
        name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "U"
    );
}

// The user's avatar (photo or initials) + a small dropdown (Profile / Logout).
// Reused in every layout's header so the profile image shows everywhere.
export default function ProfileMenu() {
    const { profile, user } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const name = profile?.full_name || user?.name || localStorage.getItem("name") || "User";
    const image = profile?.image_url;

    useEffect(() => {
        const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const goProfile = () => { setOpen(false); navigate("/profile"); };
    // the platform admin has its own pages under /admin
    const goDesign = () => { setOpen(false); navigate(location.pathname.startsWith("/admin") ? "/admin/design" : "/design"); };
    const logout = () => {
        if (window.confirm(t("layout.logout_confirm"))) {
            clearStorageOnLogout();
            window.location.href = "/";
        }
    };

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-aqua text-xs font-bold text-ocean-deep ring-2 ring-transparent transition hover:ring-aqua/40"
                title={t("layout.account")}
            >
                {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : initialsOf(name)}
            </button>

            {open && (
                <div className="absolute start-0 top-11 z-50 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop">
                    <div className="border-b border-slate-100 px-3 py-2">
                        <p className="truncate text-xs font-semibold text-slate-800">{name}</p>
                    </div>
                    <button onClick={goProfile} className="block w-full px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50">
                        {t("layout.profile")}
                    </button>
                    <button onClick={goDesign} data-open-design className="block w-full px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50">
                        {t("design.title")}
                    </button>
                    <button onClick={logout} className="block w-full px-3 py-2 text-start text-sm text-red-600 hover:bg-red-50">
                        {t("nav.logout")}
                    </button>
                </div>
            )}
        </div>
    );
}
