import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
    if (socket) return socket;

    const token = localStorage.getItem("token");

    socket = io(import.meta.env.VITE_API_BASE_URL, {
        transports: ['websocket'],
        auth: { token },
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 500,

    });

    return socket;
}

export function connectSocket() {
    const s = getSocket();
    s.auth = { token: localStorage.getItem("token") };
    if (!s.connected) s.connect();
    return s;
}

export function disconnectSocket() {
    if (socket) return;
    socket.disconnect();
}