import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  withCredentials: true,
});

API.interceptors.request.use(
  (config) => {
    const url = config.url || "";
    const method = (config.method || "get").toLowerCase();

    // ✅ Allow public GET routes for games
    if (method === "get" && (url === "/games/all" || url.startsWith("/games/"))) {
      return config;
    }

    // ✅ Attach token for all other routes (chat, users, etc.)
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (err) => Promise.reject(err)
);

export default API;
