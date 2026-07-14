import { useEffect, useRef } from "react";
import { Download, X, Share, PlusSquare, Smartphone, Monitor } from "lucide-react";
import { useTranslation } from "react-i18next";
import useOfflineStore from "../../store/useOfflineStore.js";
import toast from "react-hot-toast";

const PwaInstallModal = () => {
  const { t } = useTranslation();
  const {
    showInstallModal,
    setShowInstallModal,
    deferredPrompt,
    showIosInstallHint,
    setDeferredPrompt,
  } = useOfflineStore();

  const cancelRef = useRef(null);

  // Escape key support to close modal
  useEffect(() => {
    if (!showInstallModal) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setShowInstallModal(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showInstallModal, setShowInstallModal]);

  useEffect(() => {
    if (showInstallModal) {
      requestAnimationFrame(() => cancelRef.current?.focus());
    }
  }, [showInstallModal]);

  if (!showInstallModal) return null;

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.error(t("pwa.toastNotAvailable"));
      return;
    }
    
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      window.deferredPrompt = null;
      if (outcome === "accepted") {
        setShowInstallModal(false);
        toast.success(t("pwa.toastSuccess"));
      }else {
        setShowInstallModal(false);
        toast.error(t("pwa.toastDeclined"));
      }
    } catch (err) {
      console.error("Installation prompt error:", err);
      toast.error(t("pwa.toastError"));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-title"
    >
      {/* Backdrop with premium blur */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setShowInstallModal(false)}
      />

      {/* Modal card with rich aesthetics */}
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8
          border border-slate-100 overflow-hidden transform transition-all duration-300
          scale-100 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          ref={cancelRef}
          onClick={() => setShowInstallModal(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100
            text-slate-400 hover:text-slate-600 flex items-center justify-center
            transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20 cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>

        {/* Header App Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-100
            flex items-center justify-center shadow-inner relative group">
            <img src="/icon.png" alt="NepalSewa" className="w-12 h-12 rounded-xl object-cover" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-600
              border-2 border-white flex items-center justify-center text-white">
              <Download size={10} className="animate-bounce" />
            </div>
          </div>
        </div>

        {/* Content Section */}
        {showIosInstallHint ? (
          /* iOS specific manual install prompt */
          <div>
            <h2
              id="install-title"
              className="text-xl font-bold text-slate-900 text-center mb-2"
            >
              {t("pwa.installTitleIos")}
            </h2>
            <p className="text-sm text-slate-500 text-center leading-relaxed mb-6">
              {t("pwa.installDescIos")}
            </p>

            <div className="space-y-4 mb-8 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center
                  text-green-700 font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-sm text-slate-600 leading-relaxed">
                  {t("pwa.iosStep1Pre")}{" "}
                  <span className="font-semibold inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded text-xs text-green-600">
                    <Share size={12} /> {t("pwa.shareLabel")}
                  </span>{" "}
                  {t("pwa.iosStep1Post")}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center
                  text-green-700 font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-sm text-slate-600 leading-relaxed">
                  {t("pwa.iosStep2Pre")}{" "}
                  <span className="font-semibold inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded text-xs text-green-600">
                    <PlusSquare size={12} /> {t("pwa.addLabel")}
                  </span>
                  {t("pwa.iosStep2Post")}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center
                  text-green-700 font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-sm text-slate-600 leading-relaxed flex items-center gap-1 flex-wrap">
                  {t("pwa.iosStep3Pre")}{" "}
                  <span className="font-semibold text-green-600">{t("pwa.addTextLabel")}</span>{" "}
                  {t("pwa.iosStep3Post")}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full h-11 bg-green-600 hover:bg-green-700 text-white
                text-sm font-semibold rounded-xl transition-all shadow-md
                hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400/50 cursor-pointer"
            >
              {t("pwa.gotIt")}
            </button>
          </div>
        ) : (
          /* Standard Install Flow for Android/Chrome/Desktop */
          <div>
            <h2
              id="install-title"
              className="text-xl font-bold text-slate-900 text-center mb-2"
            >
              {t("pwa.installTitleGeneric")}
            </h2>
            <p className="text-sm text-slate-500 text-center leading-relaxed mb-6">
              {t("pwa.installDescGeneric")}
            </p>

            {/* Feature lists with nice graphics */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-2 shrink-0">
                  <Smartphone size={16} />
                </div>
                <p className="text-xs font-bold text-slate-800 mb-0.5">{t("pwa.offlineSupportTitle")}</p>
                <p className="text-[10px] text-slate-400 leading-normal">{t("pwa.offlineSupportDesc")}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-2 shrink-0">
                  <Monitor size={16} />
                </div>
                <p className="text-xs font-bold text-slate-800 mb-0.5">{t("pwa.quickAccessTitle")}</p>
                <p className="text-[10px] text-slate-400 leading-normal">{t("pwa.quickAccessDesc")}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="flex-1 h-11 border border-slate-200 text-slate-500
                  text-sm font-semibold rounded-xl hover:bg-slate-50 hover:text-slate-700
                  transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20 cursor-pointer"
              >
                {t("pwa.maybeLater")}
              </button>
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white
                  text-sm font-semibold rounded-xl transition-all shadow-md
                  hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400/50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download size={15} />
                {t("pwa.installApp")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PwaInstallModal;
