import { useState, useRef, useEffect, useCallback } from "react";
import { FiBell } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { getMyAnnouncements, markAnnouncementRead } from "../api/announcementApi";
import AnnouncementModal from "./AnnouncementModal";

// Bell + unread badge + dropdown. Only tenant_manager / branch_manager get rows
// (the API returns [] for other roles), so it just stays empty elsewhere.
export default function AnnouncementsBell() {
    const { isAuthenticated } = useAuth();
    const { t } = useTranslation();
    const [items, setItems] = useState([]);
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const ref = useRef(null);

    const load = useCallback(async () => {
        try {
            const res = await getMyAnnouncements();
            setItems(res.data ?? []);
        } catch {
            // non-fatal
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;
        load();
        const onFocus = () => load();
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [isAuthenticated, load]);

    useEffect(() => {
        const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const unread = items.filter((i) => !i.read).length;

    const openItem = async (a) => {
        setSelected(a);
        setOpen(false);
        if (!a.read) {
            try { await markAnnouncementRead(a.id); load(); } catch { /* ignore */ }
        }
    };

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/10"
                title={t("layout.announcements")}
            >
                <FiBell size={18} />
                {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute start-0 top-11 z-50 w-72 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                    <div className="border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">{t("layout.announcements")}</div>
                    <div className="max-h-80 overflow-y-auto">
                        {items.length === 0 ? (
                            <p className="px-3 py-4 text-center text-xs text-slate-400">{t("layout.no_announcements")}</p>
                        ) : (
                            items.map((a) => (
                                <button
                                    key={a.id}
                                    onClick={() => openItem(a)}
                                    className={`block w-full border-b border-slate-50 px-3 py-2 text-start transition hover:bg-slate-50 ${a.read ? "" : "bg-[#015478]/5"}`}
                                >
                                    <div className="flex items-center gap-2">
                                        {!a.read && <span className="h-2 w-2 shrink-0 rounded-full bg-[#015478]" />}
                                        <span className="truncate text-sm font-medium text-slate-800">{a.title}</span>
                                    </div>
                                    <p className="ms-4 truncate text-xs text-slate-500">{a.body || t("layout.view_details")}</p>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {selected && <AnnouncementModal announcement={selected} onClose={() => setSelected(null)} />}
        </div>
    );
}
