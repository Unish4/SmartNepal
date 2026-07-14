import { create } from "zustand";
import { getQueuedCount } from "../lib/offlineQueue.js";

const isIos = () =>
  typeof window !== "undefined" &&
  /iphone|ipad|ipod/i.test(window.navigator?.userAgent || "");

const isInStandaloneMode = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator?.standalone === true);

const useOfflineStore = create((set) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  pendingCount: 0,
  deferredPrompt: typeof window !== "undefined" ? window.deferredPrompt : null,
  isStandalone: isInStandaloneMode(),
  showIosInstallHint: isIos() && !isInStandaloneMode(),
  showInstallModal: false,
  needRefresh: false,
  updateServiceWorker: null,

  setOnline: (value) => set({ isOnline: value }),
  setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt }),
  setIsStandalone: (value) => set({ isStandalone: value }),
  setShowInstallModal: (value) => set({ showInstallModal: value }),

  refreshPendingCount: async () => {
    const count = await getQueuedCount();
    set({ pendingCount: count });
  },
}));

if (typeof window !== "undefined") {
  window.addEventListener("online", () =>
    useOfflineStore.getState().setOnline(true),
  );
  window.addEventListener("offline", () =>
    useOfflineStore.getState().setOnline(false),
  );

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
    useOfflineStore.getState().setDeferredPrompt(e);
  });

  window.addEventListener("pwa-install-promptable", () => {
    if (window.deferredPrompt) {
      useOfflineStore.getState().setDeferredPrompt(window.deferredPrompt);
    }
  });
}

export default useOfflineStore;
