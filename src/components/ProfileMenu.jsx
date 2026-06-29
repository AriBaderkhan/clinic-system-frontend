import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { clearStorageKeepingTheme } from "../utils/theme";

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
    const logout = () => {
        if (window.confirm(t("layout.logout_confirm"))) {
            clearStorageKeepingTheme();
            window.location.href = "/";
        }
    };

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#015478] text-xs font-semibold text-white ring-2 ring-transparent transition hover:ring-white/50"
                title={t("layout.account")}
            >
                {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : initialsOf(name)}
            </button>

            {open && (
                <div className="absolute start-0 top-11 z-50 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                    <div className="border-b border-slate-100 px-3 py-2">
                        <p className="truncate text-xs font-semibold text-slate-800">{name}</p>
                    </div>
                    <button onClick={goProfile} className="block w-full px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50">
                        {t("layout.profile")}
                    </button>
                    <button onClick={logout} className="block w-full px-3 py-2 text-start text-sm text-red-600 hover:bg-red-50">
                        {t("nav.logout")}
                    </button>
                </div>
            )}
        </div>
    );
}
