import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
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
    const status = error.response?.status;

    if (status === 401) {
      const isAuthRoute = error.config?.url?.includes("/api/auth/");
      if (!isAuthRoute) {
        window.location.href = "/login";
      }
    }

    if (
      status === 403 &&
      error.response?.data?.code === "TWO_FACTOR_SETUP_REQUIRED" &&
      window.location.pathname !== "/security-setup"
    ) {
      window.location.href = "/security-setup";
      return Promise.reject(error);
    }

    if (status === 429) {
      toast.error(
        error.response?.data?.message ||
          "Too many requests. Please slow down and try again shortly.",
      );
    }

    return Promise.reject(error);
  },
);

export default api;
