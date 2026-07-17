import { useEffect, useState, useRef } from "react";
import { X, HardHat, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchFieldWorkers,
  assignIssueRequest,
} from "../../services/adminService.js";
import { useFocusTrap } from "../../hooks/useFocusTrap.js";

const AssignIssueModal = ({ issue, onClose, onAssigned }) => {
  const [fieldWorkers, setFieldWorkers] = useState([]);
  const [selectedId, setSelectedId] = useState(issue.assignedTo?._id || "");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, true);

  useEffect(() => {
    fetchFieldWorkers()
      .then((res) => setFieldWorkers(res.fieldWorkers))
      .catch(() => toast.error("Failed to load field workers"))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const handle = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onClose]);

  const handleAssign = async () => {
    if (!selectedId) {
      toast.error("Please select a field worker");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await assignIssueRequest(issue._id, selectedId);
      toast.success("Issue assigned successfully");
      onAssigned(res.issue);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to assign issue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div
        role="dialog"
        ref={dialogRef}
        aria-modal="true"
        aria-labelledby="assign-issue-title"
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1 min-w-0 pr-4">
            <h2
              id="assign-issue-title"
              className="text-base font-bold text-[#0f172a]"
            >
              Assign to Field Worker
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

        {/* Loading */}
        {isLoading ? (
          <div className="py-10 text-center">
            <p className="text-sm text-[#94a3b8]">Loading field workers…</p>
          </div>
        ) : fieldWorkers.length === 0 ? (
          // Empty state — no crew exists yet
          <div className="py-8 text-center">
            <div
              className="w-12 h-12 rounded-full bg-[#f0fdf4] flex items-center
              justify-center mx-auto mb-3"
            >
              <HardHat size={20} className="text-[#16a34a]" />
            </div>
            <p className="text-sm font-medium text-[#0f172a] mb-1">
              No field workers yet
            </p>
            <p className="text-xs text-[#94a3b8] mb-4">
              Add a field worker from the Field Workers page first.
            </p>
            <button
              onClick={onClose}
              className="text-sm text-[#16a34a] hover:underline font-medium"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Field worker list — radio-card selection */}
            <div className="space-y-2 max-h-64 overflow-y-auto mb-5">
              {fieldWorkers.map((fw) => (
                <button
                  key={fw._id}
                  type="button"
                  onClick={() => setSelectedId(fw._id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2
                    text-left transition-all
                    ${
                      selectedId === fw._id
                        ? "border-[#16a34a] bg-[#f0fdf4]"
                        : "border-[#e2e8f0] hover:border-[#cbd5e1]"
                    }`}
                >
                  <div
                    className="w-9 h-9 rounded-full bg-[#f0fdf4] border
                    border-[#bbf7d0] flex items-center justify-center shrink-0"
                  >
                    <span className="text-xs font-bold text-[#16a34a]">
                      {fw.name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0f172a] truncate">
                      {fw.name}
                    </p>
                    <p className="text-xs text-[#94a3b8] truncate">
                      {fw.department}
                    </p>
                  </div>
                  {selectedId === fw._id && (
                    <CheckCircle2
                      size={18}
                      className="text-[#16a34a] shrink-0"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 h-11 border border-[#e2e8f0] text-[#475569]
                  text-sm font-semibold rounded-xl hover:bg-[#f8fafc]
                  transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={isSubmitting || !selectedId}
                className="flex-1 h-11 bg-[#16a34a] hover:bg-[#15803d] text-white
                  text-sm font-semibold rounded-xl transition-colors shadow-sm
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Assigning…" : "Assign"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AssignIssueModal;
