import { useState, useEffect, useRef } from "react";
import { X, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { updateIssueStatusRequest } from "../../services/adminService.js";
import { STATUS_CONFIG } from "../../constants/issue.js";
import { useFocusTrap } from "../../hooks/useFocusTrap.js";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "verified", label: "Verified" },
  { value: "in-progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

const StatusUpdateModal = ({ issue, onClose, onUpdated }) => {
  const [status, setStatus] = useState(issue.status);
  const [rejectionReason, setRejectionReason] = useState(
    issue.rejectionReason || "",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [resolutionCost, setResolutionCost] = useState(
    issue.resolutionCost ?? "",
  );

  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, true);

  // Close on Escape
  useEffect(() => {
    const handle = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onClose]);

  const currentSt = STATUS_CONFIG[issue.status] || STATUS_CONFIG.open;
  const newSt = STATUS_CONFIG[status] || STATUS_CONFIG.open;

  const handleSubmit = async () => {
    if (status === "rejected" && !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setIsLoading(true);
    try {
      const res = await updateIssueStatusRequest(issue._id, {
        status,
        ...(rejectionReason.trim() && {
          rejectionReason: rejectionReason.trim(),
        }),
        ...(status === "resolved" &&
          resolutionCost !== "" && { resolutionCost }),
      });
      toast.success(`Status updated to "${status}"`);
      onUpdated(res.issue);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-card"
        ref={dialogRef}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1 min-w-0 pr-4">
            <h2 id="modal-card" className="text-base font-bold text-[#0f172a]">
              Update Status
            </h2>
            <p className="text-xs text-[#94a3b8] mt-0.5 line-clamp-1">
              {issue.title}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[#94a3b8] hover:text-[#475569] transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current → New transition preview */}
        <div
          className="flex items-center gap-3 bg-[#f8fafc] rounded-xl px-4 py-3
          border border-[#e2e8f0] mb-5"
        >
          <div>
            <p className="text-[10px] text-[#94a3b8] font-medium uppercase tracking-wider mb-1">
              Current
            </p>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: currentSt.bg, color: currentSt.text }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: currentSt.dot }}
              />
              {currentSt.label}
            </span>
          </div>
          <span className="text-[#cbd5e1] text-lg shrink-0">→</span>
          <div>
            <p className="text-[10px] text-[#94a3b8] font-medium uppercase tracking-wider mb-1">
              New
            </p>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: newSt.bg, color: newSt.text }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: newSt.dot }}
              />
              {newSt.label}
            </span>
          </div>
        </div>

        {/* Resolution Proof images — shown if resolved */}
        {issue.resolutionProof?.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#475569] mb-1.5 uppercase tracking-wider">
              Resolution Proof
            </label>
            <div className="grid grid-cols-3 gap-2 border border-[#e2e8f0] rounded-xl p-2 bg-[#f8fafc]">
              {issue.resolutionProof.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="aspect-square rounded-lg overflow-hidden border border-slate-200 block hover:opacity-90 transition-opacity"
                >
                  <img
                    src={url}
                    alt={`Proof ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Status select */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-[#475569] mb-1.5 uppercase tracking-wider">
            New Status
          </label>
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-10 pl-3 pr-8 rounded-lg border border-[#e2e8f0] text-sm
                text-[#0f172a] bg-white outline-none focus:border-[#16a34a]
                focus:ring-2 focus:ring-[#16a34a]/15 transition-all cursor-pointer appearance-none"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none"
            />
          </div>
        </div>

        {status === "resolved" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Resolution cost{" "}
              <span className="text-[#94a3b8] font-normal text-xs">
                (optional, NPR)
              </span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={resolutionCost}
              onChange={(e) => setResolutionCost(e.target.value)}
              placeholder="Enter the cost of resolution"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#e2e8f0]
        outline-none focus:border-[#16a34a] transition-all"
            />
          </div>
        )}

        {/* Rejection reason — only when status is "rejected" */}
        {status === "rejected" && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#475569] mb-1.5 uppercase tracking-wider">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this report is being rejected…"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#e2e8f0]
                text-[#0f172a] placeholder:text-[#94a3b8] outline-none
                focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15
                transition-all resize-none"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-11 border border-[#e2e8f0] text-[#475569] text-sm
              font-semibold rounded-xl hover:bg-[#f8fafc] transition-colors
              disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 h-11 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm
              font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50
              disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving…" : "Update Status"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusUpdateModal;
