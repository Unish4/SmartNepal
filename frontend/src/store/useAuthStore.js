import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  loginUser,
  logoutUser,
  registerUser,
  updatePreferencesRequest,
  updateProfileRequest,
  uploadAvatarRequest,
  forgotPasswordRequest,
  resetPasswordRequest,
  verifyEmailRequest,
  resendVerificationRequest,
  fetchMe,
  fetchTwoFactorStatus,
  setupTwoFactorRequest,
  verifySetupTwoFactorRequest,
  disableTwoFactorRequest,
  verifyTwoFactorLoginRequest,
} from "../services/authService.js";
import i18n from "../i18n/index.js";

const hasPersistedAuth = () => {
  if (typeof window === "undefined") return false;
  try {
    const data = localStorage.getItem("NepalSewa-auth");
    if (!data) return false;
    const parsed = JSON.parse(data);
    return !!parsed?.state?.isAuthenticated;
  } catch {
    return false;
  }
};

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isCheckingAuth: hasPersistedAuth(),

      checkAuth: async () => {
        // If offline, skip the backend check and trust the persisted localStorage state.
        // This prevents logging the user out when they launch the PWA without internet.
        if (typeof window !== "undefined" && !navigator.onLine) {
          set({ isCheckingAuth: false });
          return;
        }

        try {
          const res = await fetchMe();
          set({ user: res.user, isAuthenticated: true });
        } catch (error) {
          // Only clear the session if the backend explicitly rejects it (e.g., 401 or 403).
          // Keep the session if it's a network failure or temporary server issue.
          if (
            error.response &&
            (error.response.status === 401 || error.response.status === 403)
          ) {
            set({ user: null, isAuthenticated: false });
          }
        } finally {
          set({ isCheckingAuth: false });
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          const res = await registerUser(userData);
          set({ user: res.user, isAuthenticated: true });
          if (res.user?.preferredLanguage) {
            i18n.changeLanguage(res.user.preferredLanguage);
          }
          return res;
        } finally {
          set({ isLoading: false });
        }
      },

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const res = await loginUser(credentials);
          if (res.requiresTwoFactor) return res;
          set({ user: res.user, isAuthenticated: true });
          if (res.user?.preferredLanguage)
            i18n.changeLanguage(res.user.preferredLanguage);
          return res;
        } finally {
          set({ isLoading: false });
        }
      },

      verifyTwoFactorLogin: async (pendingToken, code) => {
        set({ isLoading: true });
        try {
          const res = await verifyTwoFactorLoginRequest(pendingToken, code);
          set({ user: res.user, isAuthenticated: true });
          if (res.user?.preferredLanguage)
            i18n.changeLanguage(res.user.preferredLanguage);
          // Verify the session by calling checkAuth to ensure cookie is working
          await useAuthStore.getState().checkAuth();
          return res;
        } finally {
          set({ isLoading: false });
        }
      },

      getTwoFactorStatus: () => fetchTwoFactorStatus(),
      setupTwoFactor: () => setupTwoFactorRequest(),
      verifySetupTwoFactor: async (code) => {
        const res = await verifySetupTwoFactorRequest(code);
        set((state) => ({
          user: state.user
            ? { ...state.user, twoFactorEnabled: true }
            : state.user,
        }));
        return res;
      },
      disableTwoFactor: async (password, code) => {
        const res = await disableTwoFactorRequest(password, code);
        set((state) => ({
          user: state.user
            ? { ...state.user, twoFactorEnabled: false }
            : state.user,
        }));
        return res;
      },
      logout: async () => {
        try {
          await logoutUser();
        } finally {
          set({ user: null, isAuthenticated: false });
        }
      },

      updatePreferences: async (preferences) => {
        set({ isLoading: true });
        try {
          const res = await updatePreferencesRequest(preferences);
          set((state) => ({
            user: { ...state.user, ...res.user },
          }));
          return res;
        } finally {
          set({ isLoading: false });
        }
      },

      updateProfile: async (profileData) => {
        set({ isLoading: true });
        try {
          const res = await updateProfileRequest(profileData);
          set((state) => ({
            user: { ...state.user, ...res.user },
          }));
          return res;
        } finally {
          set({ isLoading: false });
        }
      },

      uploadAvatar: async (file) => {
        set({ isLoading: true });
        try {
          const res = await uploadAvatarRequest(file);
          set((state) => ({
            user: { ...state.user, ...res.user },
          }));
          return res;
        } finally {
          set({ isLoading: false });
        }
      },

      forgotPassword: async (email) => {
        set({ isLoading: true });
        try {
          return await forgotPasswordRequest(email);
        } finally {
          set({ isLoading: false });
        }
      },

      resetPassword: async (token, password) => {
        set({ isLoading: true });
        try {
          return await resetPasswordRequest(token, password);
        } finally {
          set({ isLoading: false });
        }
      },

      verifyEmail: async (token) => {
        set({ isLoading: true });
        try {
          const res = await verifyEmailRequest(token);
          // Refetch current user to reflect the verified status safely (if the active user is the verified one)
          await useAuthStore.getState().checkAuth();
          return res;
        } finally {
          set({ isLoading: false });
        }
      },

      resendVerification: async () => {
        set({ isLoading: true });
        try {
          return await resendVerificationRequest();
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "NepalSewa-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export default useAuthStore;
