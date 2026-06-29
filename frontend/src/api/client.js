import axios from "axios";

// Dev: direct to localhost:8000 | Prod: /api (proxied by Nginx)
const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:8000");

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("vidyaai_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
