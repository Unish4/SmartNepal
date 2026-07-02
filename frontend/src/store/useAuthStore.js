import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  loginUser,
  logoutUser,
  registerUser,
} from "../services/authService.js";

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      register: async (userData) => {
        set({ isLoading: true });
        try {
          const res = await registerUser(userData);
          set({ user: res.user, isAuthenticated: true });
          return res;
        } finally {
          set({ isLoading: false });
        }
      },

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const res = await loginUser(credentials);
          set({ user: res.user, isAuthenticated: true });
          return res;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await logoutUser();
        } finally {
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: "smartnepal-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export default useAuthStore;
