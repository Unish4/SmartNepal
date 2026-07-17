import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

const DISMISS_KEY = "nepalsewa-install-dismissed";

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);
const isInStandaloneMode = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(() => {
    if (typeof window !== "undefined") {
      return window.deferredPrompt || null;
    }
    return null;
  });
  const [showIosHint, setShowIosHint] = useState(() => {
    if (typeof window !== "undefined") {
      return isIos();
    }
    return false;
  });

  // Use lazy initializers to read browser state synchronously on initial render.
  // This avoids cascading render passes caused by setState calls in useEffect on mount.
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(DISMISS_KEY) === "true";
    }
    return false;
  });

  const [isStandalone] = useState(() => {
    if (typeof window !== "undefined") {
      return isInStandaloneMode();
    }
    return false;
  });

  useEffect(() => {
    if (isStandalone || dismissed) return;

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setDeferredPrompt(e);
    };

    const handleGlobalPromptable = () => {
      if (window.deferredPrompt) {
        setDeferredPrompt(window.deferredPrompt);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("pwa-install-promptable", handleGlobalPromptable);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener(
        "pwa-install-promptable",
        handleGlobalPromptable,
      );
    };
  }, [isStandalone, dismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    window.deferredPrompt = null;
    if (outcome !== "accepted") {
      // Browser fires a fresh beforeinstallprompt later if still eligible.
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIosHint(false);
  };

  if (dismissed || isStandalone) return null;
  if (!deferredPrompt && !showIosHint) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4
        sm:w-80 z-50 bg-white rounded-2xl shadow-2xl border
        border-[#e2e8f0] p-4"
    >
      <button
        onClick={handleDismiss}
        aria-label="Dismiss install prompt"
        className="absolute top-3 right-3 text-[#94a3b8] hover:text-[#475569] transition-colors cursor-pointer"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-3 pr-4">
        <div
          className="w-10 h-10 rounded-xl bg-[#16a34a] flex items-center
          justify-center shrink-0"
        >
          <Download size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0f172a] mb-1">
            Install NepalSewa
          </p>

          {deferredPrompt ? (
            <>
              <p className="text-xs text-[#64748b] mb-3">
                Add NepalSewa to your home screen for quick access and offline
                reporting.
              </p>
              <button
                onClick={handleInstall}
                className="h-9 px-4 bg-[#16a34a] hover:bg-[#15803d] text-white
                  text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Install App
              </button>
            </>
          ) : (
            <p className="text-xs text-[#64748b] flex items-center gap-1 flex-wrap leading-relaxed">
              Tap <Share size={12} className="text-[#16a34a] shrink-0" /> then
              "Add to Home Screen" to install.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
