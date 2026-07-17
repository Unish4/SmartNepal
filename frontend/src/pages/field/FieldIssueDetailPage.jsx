import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Camera,
  Loader2,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import { fetchIssueById } from "../../services/issueService.js";
import { updateAssignmentStatusRequest } from "../../services/fieldWorkerService.js";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "../../constants/issue.js";
import { timeAgo } from "../../utils/timeAgo.js";
import MiniMap from "../../components/map/MiniMap.jsx";
import ImageUploader from "../../components/issues/ImageUploader.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";

export default function FieldIssueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [issue, setIssue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [resolvePanelOpen, setResolvePanelOpen] = useState(false);
  const [proofFiles, setProofFiles] = useState([]);

  const [rejectPanelOpen, setRejectPanelOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmStart, setConfirmStart] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadIssue = async () => {
      setIsLoading(true);
      try {
        const res = await fetchIssueById(id);
        if (isActive) setIssue(res.issue);
      } catch {
        if (isActive) setError("Failed to load this assignment");
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadIssue();

    return () => {
      isActive = false;
    };
  }, [id]);

  const handleStart = async () => {
    setIsSubmitting(true);
    try {
      const res = await updateAssignmentStatusRequest(id, {
        status: "in-progress",
      });
      setIssue(res.issue);
      toast.success("Work started — good luck!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to start work");
    } finally {
      setIsSubmitting(false);
      setConfirmStart(false);
    }
  };

  const handleResolve = async () => {
    if (proofFiles.length === 0) {
      toast.error("Please attach at least one photo as proof");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await updateAssignmentStatusRequest(id, {
        status: "resolved",
        proofFiles,
      });
      setIssue(res.issue);
      setResolvePanelOpen(false);
      setProofFiles([]);
      toast.success("Marked as resolved — great work!");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to mark as resolved",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please explain why this can't be resolved");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await updateAssignmentStatusRequest(id, {
        status: "rejected",
        rejectionReason: rejectionReason.trim(),
      });
      setIssue(res.issue);
      setRejectPanelOpen(false);
      toast.success("Issue marked as unresolvable");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update issue");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-24 bg-slate-100 rounded" />
        <div className="h-48 bg-slate-100 rounded-xl" />
        <div className="h-4 w-full bg-slate-100 rounded" />
        <div className="h-24 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="text-center py-16">
        <AlertCircle size={32} className="text-slate-400 mx-auto mb-3" />
        <p className="text-sm text-[#94a3b8]">
          {error || "Assignment not found"}
        </p>
      </div>
    );
  }

  const st = STATUS_CONFIG[issue.status] || STATUS_CONFIG.open;
  const pr = PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.low;
  const hasCoords = !!(issue.location?.lat && issue.location?.lng);

  return (
    <div className="pb-4">
      {/* Back */}
      <button
        onClick={() => navigate("/field")}
        className="flex items-center gap-1.5 text-sm text-[#94a3b8]
          hover:text-[#0f172a] mb-4 transition-colors"
      >
        <ArrowLeft size={15} /> Back to assignments
      </button>

      {/* Image */}
      {issue.images?.[0] && (
        <div className="w-full h-44 rounded-xl overflow-hidden mb-4 border border-[#e2e8f0]">
          <img
            src={issue.images[0]}
            alt={issue.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Badges */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
          text-xs font-semibold"
          style={{ backgroundColor: st.bg, color: st.text }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: st.dot }}
          />
          {st.label}
        </span>
        <span
          className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold"
          style={{ backgroundColor: pr.bg, color: pr.color }}
        >
          {pr.label} priority
        </span>
      </div>

      <h1 className="text-lg font-bold text-[#0f172a] leading-snug mb-2">
        {issue.title}
      </h1>

      <div className="flex items-center gap-2 text-xs text-[#94a3b8] mb-4">
        <User size={12} /> Reported by {issue.author?.name ?? "Anonymous"}
        <span>·</span>
        <Clock size={12} /> {timeAgo(issue.createdAt)}
      </div>

      {/* Description */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 mb-4">
        <h2 className="text-xs font-semibold text-[#0f172a] uppercase tracking-wider mb-2">
          Description
        </h2>
        <p className="text-sm text-[#475569] leading-relaxed">
          {issue.description}
        </p>
      </div>

      {/* Location */}
      {hasCoords && (
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 mb-4">
          <h2 className="text-xs font-semibold text-[#0f172a] uppercase tracking-wider mb-2">
            Location
          </h2>
          <MiniMap
            lat={issue.location.lat}
            lng={issue.location.lng}
            zoomControl={true}
            dragging={true}
            doubleClickZoom={true}
            touchZoom={true}
            keyboard={true}
          />
          {issue.location.address && (
            <p className="text-xs text-[#94a3b8] mt-2 flex items-center gap-1.5">
              <MapPin size={11} className="text-[#16a34a] shrink-0" />
              {issue.location.address}
            </p>
          )}
        </div>
      )}

      {/* Proof photos — shown once resolved */}
      {issue.resolutionProof?.length > 0 && (
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 mb-4">
          <h2 className="text-xs font-semibold text-[#0f172a] uppercase tracking-wider mb-2">
            Resolution Proof
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {issue.resolutionProof.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Proof ${i + 1}`}
                className="w-full h-20 object-cover rounded-lg border border-[#e2e8f0]"
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Action area ─────────────────────────────────────────────────
          Buttons change based on current status. This is the dispatch
          workflow: verified (assigned) → in-progress → resolved/rejected. */}

      {issue.status === "verified" && !confirmStart && (
        <button
          onClick={() => setConfirmStart(true)}
          className="w-full h-12 bg-[#16a34a] hover:bg-[#15803d] text-white
            font-semibold text-sm rounded-xl transition-colors shadow-sm cursor-pointer"
        >
          Start Work
        </button>
      )}

      {issue.status === "in-progress" &&
        !resolvePanelOpen &&
        !rejectPanelOpen && (
          <div className="flex gap-3">
            <button
              onClick={() => setResolvePanelOpen(true)}
              className="flex-1 h-12 bg-[#16a34a] hover:bg-[#15803d] text-white
              font-semibold text-sm rounded-xl transition-colors shadow-sm
              flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} /> Mark Resolved
            </button>
            <button
              onClick={() => setRejectPanelOpen(true)}
              className="h-12 px-4 border border-red-200 text-red-600
              font-semibold text-sm rounded-xl hover:bg-red-50 transition-colors
              flex items-center justify-center gap-2"
            >
              <XCircle size={16} /> Can't Resolve
            </button>
          </div>
        )}

      {/* Resolve panel — requires proof photos */}
      {resolvePanelOpen && (
        <div className="bg-white rounded-xl border border-green-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Camera size={15} className="text-[#16a34a]" />
            <h3 className="text-sm font-semibold text-[#0f172a]">
              Attach proof of resolution
            </h3>
          </div>
          <p className="text-xs text-[#94a3b8] mb-3">
            Take a photo showing the issue has been fixed. At least one photo is
            required.
          </p>
          <ImageUploader onFilesChange={setProofFiles} />
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => {
                setResolvePanelOpen(false);
                setProofFiles([]);
              }}
              disabled={isSubmitting}
              className="flex-1 h-11 border border-[#e2e8f0] text-[#475569]
                text-sm font-semibold rounded-xl hover:bg-[#f8fafc] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleResolve}
              disabled={isSubmitting || proofFiles.length === 0}
              className="flex-1 h-11 bg-[#16a34a] hover:bg-[#15803d] text-white
                text-sm font-semibold rounded-xl transition-colors disabled:opacity-50
                flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Submitting…
                </>
              ) : (
                "Confirm Resolved"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Reject panel — requires a reason */}
      {rejectPanelOpen && (
        <div className="bg-white rounded-xl border border-red-200 p-4">
          <h3 className="text-sm font-semibold text-[#0f172a] mb-2">
            Why can't this be resolved?
          </h3>
          <textarea
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g. Duplicate of an existing repair, location inaccessible, false report…"
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#e2e8f0]
              outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/15
              transition-all resize-none"
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => {
                setRejectPanelOpen(false);
                setRejectionReason("");
              }}
              disabled={isSubmitting}
              className="flex-1 h-11 border border-[#e2e8f0] text-[#475569]
                text-sm font-semibold rounded-xl hover:bg-[#f8fafc] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={isSubmitting || !rejectionReason.trim()}
              className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white
                text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Submitting…" : "Confirm"}
            </button>
          </div>
        </div>
      )}

      {/* Terminal states — read-only confirmation */}
      {issue.status === "resolved" && (
        <div
          className="flex items-center gap-2 bg-green-50 border border-green-200
          rounded-xl px-4 py-3"
        >
          <CheckCircle2 size={16} className="text-[#16a34a] shrink-0" />
          <p className="text-sm text-[#15803d] font-medium">
            You marked this issue as resolved.
          </p>
        </div>
      )}
      {issue.status === "rejected" && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <XCircle size={16} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700 font-medium">
              Marked as unresolvable
            </p>
          </div>
          {issue.rejectionReason && (
            <p className="text-xs text-red-600 mt-1 pl-6">
              {issue.rejectionReason}
            </p>
          )}
        </div>
      )}

      {/* Confirm-start dialog */}
      <ConfirmDialog
        isOpen={confirmStart}
        title="Start working on this issue?"
        description="This marks the assignment as In Progress and lets the citizen know work has begun."
        confirmLabel="Start Work"
        isLoading={isSubmitting}
        onConfirm={handleStart}
        onClose={() => !isSubmitting && setConfirmStart(false)}
      />
    </div>
  );
}
