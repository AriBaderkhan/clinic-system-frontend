import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { connectSocket } from "../realtime/socket";
import { getMyNotifications, markNotificationRead, markAllNotificationsRead } from "../api/notificationApi";
import notifySound from "../assets/notify.mp3";

// Module-level so the ring fires ONCE per notification even though the bell is
// mounted twice (mobile drawer + desktop sidebar), which would otherwise attach
// two socket listeners and double the sound.
const rang = new Set();

function ring() {
    try {
        const audio = new Audio(notifySound);
        audio.volume = 0.25;               // soft — it plays inside the room
        audio.loop = true;
        audio.play().catch(() => { });     // browsers may block until first interaction
        setTimeout(() => { audio.pause(); audio.currentTime = 0; }, 10000); // stop after 10s
    } catch {
        // ignore
    }
}

// Loads my notifications, then listens on the socket for new ones. A new one
// rings the soft chime for ~10s + shows a 10s toast, then lives in the bell.
export default function useNotifications() {
    const [notifications, setNotifications] = useState([]);

    const load = useCallback(async () => {
        try {
            const body = await getMyNotifications();
            setNotifications(body.data ?? []);
        } catch {
            // non-fatal
        }
    }, []);

    useEffect(() => {
        load();
        const socket = connectSocket();

        const onNotification = (n) => {
            setNotifications((prev) => (prev.some((x) => x.id === n.id) ? prev : [n, ...prev]));

            if (!rang.has(n.id)) {
                rang.add(n.id);
                ring();
                toast(n.message, { duration: 10000, id: `notif_${n.id}` });
                setTimeout(() => rang.delete(n.id), 12000);
            }
        };

        socket.on("notification", onNotification);
        return () => socket.off("notification", onNotification);
    }, [load]);

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    const markRead = useCallback(async (id) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
        try {
            await markNotificationRead(id);
        } catch {
            // ignore — the UI already reflects it
        }
    }, []);

    const markAllRead = useCallback(async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        try {
            await markAllNotificationsRead();
        } catch {
            // ignore — the UI already reflects it
        }
    }, []);

    return { notifications, unreadCount, markRead, markAllRead, refresh: load };
}
