import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
    if (socket) return socket;

    socket = io(import.meta.env.VITE_API_BASE_URL, {
        transports: ['websocket'],
        // read the CURRENT token on every (re)connect — the login token is renewed every hour
        auth: (cb) => cb({ token: localStorage.getItem("token") }),
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 500,

    });

    return socket;
}

export function connectSocket() {
    const s = getSocket();
    if (!s.connected) s.connect();
    return s;
}

export function disconnectSocket() {
    if (!socket) return; // never connected: nothing to close
    socket.disconnect();
}