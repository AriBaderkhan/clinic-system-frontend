import { useState, useRef, useEffect, useCallback } from "react";
import { FiBell } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useSettings } from "../context/SettingContext";
import { useAuth } from "../context/AuthContext";
import useNotifications from "../hooks/useNotifications";
import { getMyAnnouncements, markAnnouncementRead } from "../api/announcementApi";
import AnnouncementModal from "./AnnouncementModal";

// Single bell for everything: live notifications (check-in / completion) AND
// platform announcements, merged into one time-sorted dropdown with one unread
// badge. Clicking a notification marks it read; clicking an announcement opens
// its modal.
export default function NotificationBell() {
    const { t } = useTranslation();
    const { formatDateTime } = useSettings();
    const { isAuthenticated } = useAuth();
    const { notifications, markRead } = useNotifications();

    const [announcements, setAnnouncements] = useState([]);
    const [selected, setSelected] = useState(null);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const loadAnnouncements = useCallback(async () => {
        try {
            const res = await getMyAnnouncements();
            setAnnouncements(res.data ?? []);
        } catch {
            // non-fatal — announcements just stay empty
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;
        loadAnnouncements();
        const onFocus = () => loadAnnouncements();
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [isAuthenticated, loadAnnouncements]);

    useEffect(() => {
        const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const openAnnouncement = async (a) => {
        setSelected(a);
        setOpen(false);
        if (!a.read) {
            try { await markAnnouncementRead(a.id); loadAnnouncements(); } catch { /* ignore */ }
        }
    };

    // Merge both sources into one list, newest first.
    const items = [
        ...notifications.map((n) => ({
            key: `n_${n.id}`, read: n.is_read, at: n.created_at, text: n.message,
            onClick: () => markRead(n.id),
        })),
        ...announcements.map((a) => ({
            key: `a_${a.id}`, read: a.read, at: a.created_at, text: a.title,
            onClick: () => openAnnouncement(a),
        })),
    ].sort((x, y) => new Date(y.at) - new Date(x.at));

    const unread = items.filter((i) => !i.read).length;

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/10"
                title={t("notif.title")}
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
                    <div className="border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">{t("notif.title")}</div>
                    <div className="max-h-80 overflow-y-auto">
                        {items.length === 0 ? (
                            <p className="px-3 py-4 text-center text-xs text-slate-400">{t("notif.empty")}</p>
                        ) : (
                            items.map((i) => (
                                <button
                                    key={i.key}
                                    onClick={i.onClick}
                                    className={`block w-full border-b border-slate-50 px-3 py-2 text-start transition hover:bg-slate-50 ${i.read ? "" : "bg-[#015478]/5"}`}
                                >
                                    <div className="flex items-center gap-2">
                                        {!i.read && <span className="h-2 w-2 shrink-0 rounded-full bg-[#015478]" />}
                                        <span className="text-sm font-medium text-slate-800">{i.text}</span>
                                    </div>
                                    <p className="ms-4 mt-0.5 text-[11px] text-slate-500">{formatDateTime(i.at)}</p>
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
