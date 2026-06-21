import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 30000,
    headers: { "Content-Type": "application/json" }
});

/* ---------- REQUEST: attach the access token ---------- */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/* ---------- silent refresh state ---------- */
// When the access token expires, the FIRST failing request triggers one /refresh
// call; any other requests that fail at the same moment wait in this queue and
// then retry with the new token (so we never fire 10 refreshes at once).
let isRefreshing = false;
let waiters = [];
const flushWaiters = (error, token = null) => {
    waiters.forEach((w) => (error ? w.reject(error) : w.resolve(token)));
    waiters = [];
};

// Refresh failed / no refresh token → wipe auth and bounce to login.
const forceLogout = () => {
    ["token", "refreshToken", "user", "role", "name", "email", "availableBranches"]
        .forEach((k) => localStorage.removeItem(k));
    if (window.location.pathname !== "/") window.location.href = "/";
};

/* ---------- RESPONSE: error message + auto-refresh on 401 ---------- */
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;
        const status = error?.response?.status;

        // keep the existing user-safe message
        const data = error?.response?.data;
        error.userMessage = data?.message
            ? (data.support_code ? `${data.message} (Support Code: ${data.support_code})` : data.message)
            : "Something went wrong. Please try again.";

        // don't try to refresh auth endpoints themselves, and only retry once
        const url = original?.url || "";
        const isAuthCall = url.includes("/login") || url.includes("/refresh") || url.includes("/logout");

        if (status !== 401 || original?._retry || isAuthCall) {
            return Promise.reject(error);
        }

        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
            forceLogout();
            return Promise.reject(error);
        }

        // a refresh is already happening → wait for it, then retry this request
        if (isRefreshing) {
            return new Promise((resolve, reject) => waiters.push({ resolve, reject }))
                .then((newToken) => {
                    original._retry = true;
                    original.headers.Authorization = `Bearer ${newToken}`;
                    return api(original);
                });
        }

        // I'm the first 401 → do the one refresh
        original._retry = true;
        isRefreshing = true;
        try {
            // raw axios (not `api`) so this call doesn't loop back through here
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/refresh`, { refreshToken });
            const newToken = res.data?.token;
            if (!newToken) throw new Error("No token from refresh");

            localStorage.setItem("token", newToken);
            flushWaiters(null, newToken);

            original.headers.Authorization = `Bearer ${newToken}`;
            return api(original);
        } catch (refreshErr) {
            flushWaiters(refreshErr, null);
            forceLogout();
            return Promise.reject(refreshErr);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
