import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { useFocusTrap } from "../../hooks/useFocusTrap.js";

const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmLabel = "Delete",
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  const cancelRef = useRef(null);
  const dialogRef = useRef(null);

  useFocusTrap(dialogRef, isOpen);

  // Escape key support
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e) => {
      if (e.key === "Escape" && !isLoading) onClose();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [isOpen, isLoading, onClose]);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => cancelRef.current?.focus());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-999 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-description"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => !isLoading && onClose()}
      />

      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      ></div>

      {/* Dialog card */}
      <div
        ref={dialogRef}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning icon */}
        <div
          className="w-12 h-12 bg-red-50 rounded-full flex items-center
          justify-center mx-auto mb-4"
        >
          <AlertTriangle size={22} className="text-red-500" />
        </div>

        <h2
          id="confirm-title"
          className="text-base font-bold text-[#0f172a] text-center mb-2"
        >
          {title}
        </h2>
        <p
          id="confirm-description"
          className="text-sm text-[#64748b] text-center leading-relaxed mb-6"
        >
          {description}
        </p>

        <div className="flex gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-11 border border-[#e2e8f0] text-[#475569]
              text-sm font-semibold rounded-xl hover:bg-[#f8fafc]
              transition-colors disabled:opacity-50 focus:outline-none
              focus:ring-2 focus:ring-[#16a34a]/30"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 h-11 bg-red-600 text-white text-sm
              font-semibold rounded-xl hover:bg-red-700 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none
              focus:ring-2 focus:ring-red-400/50"
          >
            {isLoading ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
