import { useEffect, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const SESSION_SUPPRESS_KEY = "nepalsewa-update-postponed";

const UpdatePrompt = () => {
  const toastIdRef = useRef(null);
  
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) {
        // Poll for updates every hour
        setInterval(() => registration.update(), 60 * 60 * 1000);

        // If a genuinely new update starts downloading, clear the session postponement key
        registration.addEventListener("updatefound", () => {
          sessionStorage.removeItem(SESSION_SUPPRESS_KEY);
        });
      }
    },
  });

  useEffect(() => {
    if (needRefresh) {
      // Check if user has already chosen "Later" for the current pending update in this session
      const isSuppressed = sessionStorage.getItem(SESSION_SUPPRESS_KEY) === "true";
      if (isSuppressed) return;

      // Dismiss any existing update toast first to avoid duplicates
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }

      // Show a custom, modern toast
      toastIdRef.current = toast.custom(
        (t) => (
          <div
            className={`${
              t.visible 
                ? "animate-in fade-in slide-in-from-bottom-5 duration-300" 
                : "animate-out fade-out slide-out-to-bottom-5 duration-300"
            } max-w-sm w-full bg-[#0f172a] shadow-2xl rounded-2xl pointer-events-auto flex p-4`}
          >
            <div className="flex items-start gap-3 w-full">
              <div
                className="w-9 h-9 rounded-lg bg-[#16a34a]/20 flex items-center
                justify-center shrink-0"
              >
                <RefreshCw size={16} className="text-[#4ade80]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white mb-1">
                  Update available
                </p>
                <p className="text-xs text-[#94a3b8] mb-3">
                  A new version of NepalSewa is ready.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      updateServiceWorker(true);
                      toast.dismiss(t.id);
                    }}
                    className="h-8 px-3 bg-[#16a34a] hover:bg-[#15803d] text-white
                      text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Reload
                  </button>
                  <button
                    onClick={() => {
                      sessionStorage.setItem(SESSION_SUPPRESS_KEY, "true");
                      setNeedRefresh(false);
                      toast.dismiss(t.id);
                    }}
                    className="h-8 px-3 text-[#94a3b8] hover:text-white text-xs
                      font-medium transition-colors cursor-pointer"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        ),
        {
          duration: Infinity, // Persistent toast until user explicitly acts ("Reload" or "Later")
          position: "bottom-right",
        }
      );
    }
  }, [needRefresh, updateServiceWorker, setNeedRefresh]);

  return null; // Toast is managed imperatively
};

export default UpdatePrompt;
