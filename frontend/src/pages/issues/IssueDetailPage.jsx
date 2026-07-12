import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  MapPin,
  Clock,
  CheckCircle,
  Sparkles,
  Eye,
  Link2,
  Pencil,
  Trash2,
  AlertCircle,
  Building2,
} from "lucide-react";
import toast from "react-hot-toast";
import useIssueStore from "../../store/useIssueStore.js";
import useAuthStore from "../../store/useAuthStore.js";
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  CATEGORY_CONFIG,
  CATEGORY_ICONS,
} from "../../constants/issue.js";
import { timeAgo } from "../../utils/timeAgo.js";
import MiniMap from "../../components/map/MiniMap.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import UpvoteButton from "../../components/issues/UpvoteButton.jsx";

// ── Timeline ─────────────────────────────────────────────────────────────────
function IssueTimeline({ status }) {
  const STEPS = [
    {
      key: "submitted",
      title: "Issue Submitted",
      desc: "Report filed via DigitalSewa by citizen.",
    },
    {
      key: "verified",
      title: "Verified",
      desc: "Ward officer verified the report.",
    },
    {
      key: "in-progress",
      title: "Assigned to Dept.",
      desc: "Forwarded to the relevant department.",
    },
    {
      key: "resolved",
      title: "Resolved",
      desc: "Issue repaired and field-verified.",
    },
  ];

  const ORDER = {
    submitted: 0,
    open: 0,
    verified: 1,
    "in-progress": 2,
    resolved: 3,
  };
  const currentLevel = ORDER[status] ?? 0;

  return (
    <div>
      {STEPS.map((step, i) => {
        const stepLevel = ORDER[step.key] ?? i;
        const done = stepLevel < currentLevel || step.key === "submitted";
        const current = stepLevel === currentLevel && step.key !== "submitted";
        const pending = !done && !current;

        return (
          <div key={step.key} className="flex gap-4">
            <div className="flex flex-col items-center w-5 shrink-0">
              {done ? (
                <div className="w-5 h-5 rounded-full bg-[#16a34a] flex items-center justify-center mt-0.5 shrink-0">
                  <CheckCircle size={11} className="text-white" fill="white" />
                </div>
              ) : current ? (
                <div className="relative flex w-5 h-5 mt-0.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16a34a] opacity-25" />
                  <span className="relative w-5 h-5 rounded-full bg-[#16a34a] border-2 border-white shadow-md" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-[#e2e8f0] bg-white mt-0.5 shrink-0" />
              )}
              {i < STEPS.length - 1 && (
                <div
                  className={`w-0.5 flex-1 my-1.5 mx-auto ${pending ? "border-l-2 border-dashed border-[#e2e8f0]" : "bg-[#16a34a]/25"}`}
                  style={{ minHeight: 28 }}
                />
              )}
            </div>
            <div className="pb-5 flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className={`text-sm font-medium ${pending ? "text-[#94a3b8]" : "text-[#0f172a]"}`}
                >
                  {step.title}
                </span>
                {current && (
                  <span className="text-[10px] bg-amber-50 text-amber-600 font-semibold px-1.5 py-0.5 rounded-full border border-amber-100">
                    Current
                  </span>
                )}
              </div>
              <p
                className={`text-xs leading-relaxed ${pending ? "text-[#94a3b8]" : "text-[#64748b]"}`}
              >
                {step.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function IssueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentIssue, isLoading, error, getIssueById, deleteIssue } =
    useIssueStore();
  const { user, isAuthenticated } = useAuthStore();

  const [selectedThumb, setSelectedThumb] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getIssueById(id);
    Promise.resolve().then(() => {
      setSelectedThumb(0); // Reset to first image when issue changes
    });
  }, [id, getIssueById]); // Only depend on id, not the full currentIssue object

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteIssue(id);
      toast.success("Issue deleted successfully");
      navigate("/issues");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete issue");
      setIsDeleting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-6 animate-pulse space-y-4">
        <div className="h-4 w-48 bg-[#f1f5f9] rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-[65fr_35fr] gap-6">
          <div className="space-y-4">
            <div className="h-120 bg-[#f1f5f9] rounded-xl" />
            <div className="h-64 bg-[#f1f5f9] rounded-xl" />
          </div>
          <div className="space-y-4">
            <div className="h-40 bg-[#f1f5f9] rounded-xl" />
            <div className="h-64 bg-[#f1f5f9] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !currentIssue) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <AlertCircle size={40} className="text-[#e2e8f0] mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-[#0f172a] mb-2">
          Issue not found
        </h2>
        <p className="text-sm text-[#94a3b8] mb-5">
          {error || "This issue may have been removed."}
        </p>
        <Link to="/issues" className="text-[#16a34a] hover:underline text-sm">
          ← Back to issues
        </Link>
      </div>
    );
  }

  const st = STATUS_CONFIG[currentIssue.status] || STATUS_CONFIG.open;
  const pr = PRIORITY_CONFIG[currentIssue.priority] || PRIORITY_CONFIG.low;
  const catColor =
    CATEGORY_CONFIG[currentIssue.category] || CATEGORY_CONFIG["Other"];
  const CategoryIcon = CATEGORY_ICONS[currentIssue.category] || AlertCircle;
  const hasImages = currentIssue.images?.length > 0;
  const hasCoords = !!(
    currentIssue.location?.lat && currentIssue.location?.lng
  );
  const hasAddress = !!currentIssue.location?.address;
  const thumbs = hasImages ? currentIssue.images : [];

  // Ensure selectedThumb doesn't exceed available images
  const safeSelectedThumb = Math.min(selectedThumb, thumbs.length - 1);

  const isOwner =
    isAuthenticated &&
    (user?._id === currentIssue.author?._id ||
      user?._id === currentIssue.author ||
      user?.role === "admin");

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-6 text-[#64748b]">
          <Link to="/issues" className="hover:text-[#0f172a] transition-colors">
            Issues
          </Link>
          <ChevronRight size={14} className="text-[#94a3b8]" />
          <span>{currentIssue.category}</span>
          <ChevronRight size={14} className="text-[#94a3b8]" />
          <span className="text-[#0f172a] font-medium">
            #{currentIssue._id.slice(-8).toUpperCase()}
          </span>

          {/* Owner actions on the right */}
          {isOwner && (
            <div className="ml-auto flex items-center gap-2">
              <Link
                to={`/issues/${id}/edit`}
                className="flex items-center gap-1.5 text-sm text-blue-600
                  px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Pencil size={13} /> Edit
              </Link>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-1.5 text-sm text-red-600
                  px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}
        </nav>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[65fr_35fr] gap-6 items-start">
          {/* ── Left column ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Image gallery */}
            {hasImages ? (
              <div>
                <div
                  className="relative w-full rounded-xl overflow-hidden bg-slate-100
                  border border-[#e2e8f0]"
                  style={{ height: 480 }}
                >
                  <img
                    src={thumbs[safeSelectedThumb]}
                    alt={currentIssue.title}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: st.bg, color: st.text }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: st.dot }}
                      />
                      {st.label}
                    </span>
                  </div>
                </div>
                {/* Thumbnail strip */}
                {thumbs.length > 1 && (
                  <div className="flex items-center gap-2 mt-2.5 overflow-x-auto pb-1">
                    {thumbs.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedThumb(i)}
                        className={`h-16 w-24 rounded-lg overflow-hidden shrink-0 border-2 transition-all
                          ${
                            safeSelectedThumb === i
                              ? "border-[#16a34a] ring-2 ring-[#16a34a]/20"
                              : "border-transparent hover:border-[#cbd5e1]"
                          }`}
                      >
                        <img
                          src={src}
                          alt={`Photo ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div
                className="w-full h-70 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]
                flex items-center justify-center"
              >
                <CategoryIcon
                  size={48}
                  style={{ color: catColor.color, opacity: 0.3 }}
                />
              </div>
            )}

            {/* Main content card */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6">
              {/* Badges */}
              {/* Badges — now includes AI badge when available */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: catColor.bg,
                    color: catColor.color,
                  }}
                >
                  <CategoryIcon size={10} />
                  {currentIssue.category}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
                  style={{ backgroundColor: pr.bg, color: pr.color }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: pr.color }}
                  />
                  {pr.label}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: st.bg, color: st.text }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: st.dot }}
                  />
                  {st.label}
                </span>

                {/* AI badge — shown when Gemini categorized this issue after creation */}
                {currentIssue.aiCategory &&
                  currentIssue.aiConfidence != null && (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
      text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100"
                    >
                      <Sparkles size={10} />
                      AI · {currentIssue.aiConfidence}% confidence
                    </span>
                  )}
              </div>

              <h2 className="text-xl font-semibold text-[#0f172a] leading-snug mb-4">
                {currentIssue.title}
                {/* Add Sparkles for resolved issues */}
                {currentIssue.status === "resolved" && (
                  <Sparkles size={18} className="inline ml-2 text-[#16a34a]" />
                )}
              </h2>

              {/* Reporter */}
              <div className="flex items-center gap-2 text-sm text-[#64748b] mb-1">
                <div
                  className="w-8 h-8 rounded-full bg-[#f0fdf4] text-[#16a34a] font-semibold
                  text-xs border border-[#bbf7d0] flex items-center justify-center shrink-0"
                >
                  {currentIssue.author?.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <span>
                  Reported by{" "}
                  <span className="font-medium text-[#0f172a]">
                    {currentIssue.author?.name ?? "Anonymous"}
                  </span>
                </span>
                <span className="text-[#cbd5e1]">·</span>
                <span className="text-[#94a3b8]">
                  {timeAgo(currentIssue.createdAt)}
                </span>
              </div>

              {hasAddress && (
                <p className="text-xs text-[#94a3b8] ml-10 mb-5 flex items-center gap-1">
                  <MapPin size={10} className="text-[#16a34a] shrink-0" />
                  {currentIssue.location.address}
                </p>
              )}

              <div className="border-t border-[#f1f5f9] mb-5" />

              <h4 className="text-sm font-semibold text-[#0f172a] mb-2.5">
                Description
              </h4>
              <p className="text-sm text-[#475569] leading-[1.75] mb-5 whitespace-pre-wrap">
                {currentIssue.description}
              </p>

              {/* Resolution Proof — shown once resolved */}
              {currentIssue.resolutionProof?.length > 0 && (
                <>
                  <div className="border-t border-[#f1f5f9] mb-5" />
                  <h4 className="text-sm font-semibold text-[#0f172a] mb-3 flex items-center gap-2">
                    <CheckCircle size={15} className="text-[#16a34a]" />
                    Resolution Proof
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                    {currentIssue.resolutionProof.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="aspect-video rounded-xl overflow-hidden border border-[#e2e8f0] block hover:opacity-90 transition-opacity"
                      >
                        <img
                          src={url}
                          alt={`Resolution Proof ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </>
              )}

              {/* Location */}
              {hasCoords && (
                <>
                  <div className="border-t border-[#f1f5f9] mb-5" />
                  <h4 className="text-sm font-semibold text-[#0f172a] mb-3">
                    Location
                  </h4>
                  <MiniMap
                    lat={currentIssue.location.lat}
                    lng={currentIssue.location.lng}
                  />
                  {hasAddress && (
                    <p className="text-xs text-[#94a3b8] mt-2 flex items-center gap-1.5">
                      <MapPin size={11} className="text-[#16a34a] shrink-0" />
                      {currentIssue.location.address}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Timeline card */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6">
              <h4 className="text-sm font-semibold text-[#0f172a] mb-6">
                Issue Timeline
              </h4>
              <IssueTimeline status={currentIssue.status} />
            </div>

            {/* Upvote + share bar */}
            <div
              className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm px-5 py-4
              flex items-center gap-4 flex-wrap"
            >
              <UpvoteButton issue={currentIssue} variant="detail" />
              <div className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
                <Eye size={12} />
                {currentIssue.upvoterIds?.length ?? 0} upvotes
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied to clipboard!");
                }}
                className="ml-auto flex items-center gap-2 h-10 px-4 rounded-lg border
                  border-[#e2e8f0] text-sm font-medium text-[#475569] hover:bg-[#f8fafc]
                  hover:border-[#cbd5e1] transition-all"
              >
                <Link2 size={14} /> Share
              </button>
            </div>
          </div>

          {/* ── Right sidebar ────────────────────────────────────────────── */}
          <div className="space-y-4 lg:sticky lg:top-22 self-start">
            {/* Status card */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6 text-center">
              <div className="flex justify-center mb-3">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                  style={{ backgroundColor: st.bg, color: st.text }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: st.dot }}
                  />
                  {st.label}
                  {/* Add Sparkles for resolved status */}
                  {currentIssue.status === "resolved" && (
                    <Sparkles size={12} className="ml-0.5" />
                  )}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-[#0f172a] mb-1">
                {st.label}
              </h3>
              <p className="text-sm text-[#64748b] mb-5">
                {currentIssue.status === "resolved"
                  ? "Issue has been resolved"
                  : currentIssue.status === "in-progress"
                    ? "Assigned to relevant department"
                    : "Pending review"}
              </p>
              {currentIssue.status !== "resolved" &&
                currentIssue.status !== "rejected" && (
                  <div
                    className="flex items-center justify-center gap-1.5 text-sm font-medium
                  text-[#16a34a] bg-[#f0fdf4] rounded-lg py-2.5 border border-[#dcfce7]"
                  >
                    <Clock size={14} />
                    Est. resolution: within 5 days
                  </div>
                )}
              {currentIssue.status === "rejected" &&
                currentIssue.rejectionReason && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-left">
                    <p className="text-xs font-medium text-red-700 mb-1">
                      Rejection reason:
                    </p>
                    <p className="text-xs text-red-600">
                      {currentIssue.rejectionReason}
                    </p>
                  </div>
                )}
            </div>

            {/* Issue details */}

            <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#f1f5f9]">
                <h4 className="text-sm font-semibold text-[#0f172a]">
                  Issue Details
                </h4>
              </div>

              {/* Phase 17 — GIS boundary card — shown when province/district detected */}
              {(currentIssue.location?.province ||
                currentIssue.location?.district) && (
                <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 size={14} className="text-[#16a34a]" />
                    <h2 className="text-sm font-semibold text-[#0f172a]">
                      Administrative Location
                    </h2>
                    <span
                      className="text-[10px] font-semibold text-[#16a34a] bg-[#f0fdf4]
        border border-[#bbf7d0] px-2 py-0.5 rounded-full ml-auto"
                    >
                      Auto-detected
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentIssue.location.ward && (
                      <span
                        className="text-xs font-medium text-[#475569] bg-[#f8fafc]
          border border-[#e2e8f0] px-3 py-1.5 rounded-full"
                      >
                        {currentIssue.location.ward}
                      </span>
                    )}
                    {currentIssue.location.municipality && (
                      <span
                        className="text-xs font-medium text-[#475569] bg-[#f8fafc]
          border border-[#e2e8f0] px-3 py-1.5 rounded-full"
                      >
                        {currentIssue.location.municipality}
                      </span>
                    )}
                    {currentIssue.location.district && (
                      <span
                        className="text-xs text-[#0f172a] bg-white
          border border-[#cbd5e1] px-3 py-1.5 rounded-full font-semibold"
                      >
                        {currentIssue.location.district}
                      </span>
                    )}
                    {currentIssue.location.province && (
                      <span
                        className="text-xs font-semibold text-[#16a34a] bg-[#f0fdf4]
          border border-[#bbf7d0] px-3 py-1.5 rounded-full"
                      >
                        {currentIssue.location.province}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {[
                {
                  label: "Issue ID",
                  value: `#${currentIssue._id.slice(-8).toUpperCase()}`,
                },
                { label: "Category", value: currentIssue.category },
                { label: "Status", value: st.label },
                { label: "Priority", value: pr.label },
                {
                  label: "Upvotes",
                  value: currentIssue.upvoterIds?.length ?? 0,
                },

                // Phase 17 — GIS-detected admin boundaries
                ...(currentIssue.location?.province
                  ? [
                      {
                        label: "Province",
                        value: currentIssue.location.province,
                      },
                    ]
                  : []),
                ...(currentIssue.location?.district
                  ? [
                      {
                        label: "District",
                        value: currentIssue.location.district,
                      },
                    ]
                  : []),
                ...(currentIssue.location?.municipality
                  ? [
                      {
                        label: "Municipality",
                        value: currentIssue.location.municipality,
                      },
                    ]
                  : []),
                ...(currentIssue.location?.ward
                  ? [{ label: "Ward", value: currentIssue.location.ward }]
                  : []),

                {
                  label: "Photos",
                  value: `${currentIssue.images?.length ?? 0} attached`,
                },
                {
                  label: "Submitted",
                  value: new Date(currentIssue.createdAt).toLocaleDateString(
                    "en-NP",
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    },
                  ),
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex justify-between items-center
    px-5 py-2.5 border-b border-[#f8fafc] last:border-0"
                >
                  <dt className="text-xs text-[#94a3b8]">{label}</dt>
                  <dd className="text-xs font-medium text-[#0f172a] text-right max-w-45 truncate">
                    {value}
                  </dd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete this report?"
        description={`"${currentIssue.title}" will be permanently removed and cannot be recovered.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => !isDeleting && setShowDeleteDialog(false)}
      />
    </div>
  );
}
