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
                className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-800 transition hover:bg-white/10 hover:text-slate-950"
                title={t("layout.announcements")}
            >
                <FiBell size={18} />
                {unread > 0 && (
                    <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-ocean">
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="fixed inset-x-3 top-16 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop sm:absolute sm:inset-x-auto sm:start-0 sm:top-11 sm:w-80">
                    <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">{t("layout.announcements")}</div>
                    <div className="max-h-80 overflow-y-auto">
                        {items.length === 0 ? (
                            <p className="px-4 py-8 text-center text-sm text-slate-500">{t("layout.no_announcements")}</p>
                        ) : (
                            items.map((a) => (
                                <button
                                    key={a.id}
                                    onClick={() => openItem(a)}
                                    className={`block w-full border-b border-slate-100 px-4 py-2.5 text-start transition last:border-0 hover:bg-slate-100 ${a.read ? "" : "bg-brand/10"}`}
                                >
                                    <div className="flex items-center gap-2">
                                        {!a.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />}
                                        <span className="min-w-0 truncate text-sm font-medium text-slate-900">{a.title}</span>
                                    </div>
                                    <p className="ms-4 mt-0.5 truncate text-xs text-slate-500">{a.body || t("layout.view_details")}</p>
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
