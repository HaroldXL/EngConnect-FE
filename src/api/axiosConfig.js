import axios from "axios";

const BASE_URL = "https://engconnect-prod.gdev.id.vn/api/";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Token refresh state ──────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const clearAuthAndRedirect = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  // Let React auth state pick up the missing token on next render
  globalThis.dispatchEvent(new Event("auth:logout"));
};

// ── Request interceptor ──────────────────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor ─────────────────────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Never retry the refresh endpoint itself (would cause infinite loop)
      if (originalRequest.url?.includes("/auth/v1/refresh-token")) {
        clearAuthAndRedirect();
        throw error;
      }

      if (isRefreshing) {
        // Queue concurrent requests while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => { throw err; });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const storedRefreshToken = localStorage.getItem("refreshToken");

      if (!storedRefreshToken) {
        isRefreshing = false;
        clearAuthAndRedirect();
        throw error;
      }

      try {
        const storedAccessToken = localStorage.getItem("accessToken");
        // Use plain axios (not axiosInstance) to avoid interceptor loop
        const res = await axios.post(`${BASE_URL}auth/v1/refresh-token`, {
          accessToken: storedAccessToken,
          refreshToken: storedRefreshToken,
        });

        const data = res.data;
        if (!data?.isSuccess || !data?.data?.accessToken) {
          throw new Error("Refresh failed");
        }

        const newAccessToken = data.data.accessToken;
        localStorage.setItem("accessToken", newAccessToken);
        if (data.data.refreshToken) {
          localStorage.setItem("refreshToken", data.data.refreshToken);
        }

        axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthAndRedirect();
        throw refreshError;
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response) {
      switch (error.response.status) {
        case 403:
          console.error("Access forbidden");
          break;
        case 404:
          console.error("Resource not found");
          break;
        case 500:
          console.error("Internal server error");
          break;
        default:
          console.error("An error occurred:", error.response.data);
      }
    } else if (error.request) {
      console.error("No response received from server");
    } else {
      console.error("Error setting up request:", error.message);
    }

    throw error;
  },
);

export default axiosInstance;
