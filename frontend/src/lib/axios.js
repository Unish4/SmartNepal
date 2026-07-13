import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
});

// Request interceptor — passes all requests through unchanged.
// withCredentials on the instance handles cookie attachment automatically.
api.interceptors.request.use(
  (config) => {
    // Only set Content-Type for JSON requests, not FormData
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (error.response?.status === 429) {
      toast.error(
        error.response?.data?.message ||
          "Too many requests. Please slow down and try again shortly.",
      );
    }

    return Promise.reject(error);
  },
);

export default api;