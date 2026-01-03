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
// console.log(import.meta.env.VITE_API_BASE_URL)
export default api