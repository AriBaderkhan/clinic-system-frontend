import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 10000,
    headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token"); // same key you used in login

        if (token) {
            // attach token to header
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/* ---------- RESPONSE INTERCEPTOR (ERROR HANDLING) ---------- */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error?.response?.data;

    // 🔴 Build ONE final user-safe message everywhere
    if (data?.message) {
      error.userMessage = data.support_code
        ? `${data.message} (Support Code: ${data.support_code})`
        : data.message;
    } else {
      error.userMessage = "Something went wrong. Please try again.";
    }

    return Promise.reject(error);
  }
);
// console.log(import.meta.env.VITE_API_BASE_URL)
export default api