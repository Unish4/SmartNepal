import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  AlertCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import useIssueStore from "../../store/useIssueStore.js";
import useAuthStore from "../../store/useAuthStore.js";
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  CATEGORY_ICONS,
} from "../../constants/issue.js";
import { timeAgo } from "../../utils/timeAgo.js";
import MiniMap from "../../components/map/MiniMap.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import UpvoteButton from "../../components/issues/UpvoteButton.jsx";

const IssueDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentIssue, isLoading, error, getIssueById, deleteIssue } =
    useIssueStore();
  const { user, isAuthenticated } = useAuthStore();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getIssueById(id);
  }, [id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteIssue(id);
      toast.success("Issue deleted successfully");
      navigate("/issues");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete issue");
      setIsDeleting(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-4 w-28 bg-gray-100 rounded" />
        <div className="h-64 bg-gray-100 rounded-xl" />
        <div className="h-5 w-2/3 bg-gray-100 rounded" />
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-4/5 bg-gray-100 rounded" />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !currentIssue) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <AlertCircle size={40} className="text-gray-300 mx-auto mb-4" />
        <h2 className="text-gray-900 font-medium mb-2">Issue not found</h2>
        <p className="text-gray-500 text-sm mb-5">
          {error || "This issue may have been removed."}
        </p>
        <Link to="/issues" className="text-green-600 hover:underline text-sm">
          ← Back to issues
        </Link>
      </div>
    );
  }

  const status = STATUS_CONFIG[currentIssue.status] || STATUS_CONFIG.open;
  const priority =
    PRIORITY_CONFIG[currentIssue.priority] || PRIORITY_CONFIG.low;
  const CategoryIcon = CATEGORY_ICONS[currentIssue.category] || AlertCircle;
  const hasImages = currentIssue.images?.length > 0;
  const hasCoords = !!(
    currentIssue.location?.lat && currentIssue.location?.lng
  );
  const hasAddress = !!currentIssue.location?.address;

  const isOwner =
    isAuthenticated &&
    (user?._id === currentIssue.author?._id ||
      user?._id === currentIssue.author ||
      user?.role === "admin");

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500
            hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to issues
        </button>

        {isOwner && (
          <div className="flex items-center gap-2">
            <Link
              to={`/issues/${id}/edit`}
              className="flex items-center gap-1.5 text-sm text-blue-600
                px-3 py-2 border border-blue-200 rounded-lg hover:bg-blue-50
                transition-colors"
            >
              <Pencil size={14} />
              Edit
            </Link>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-1.5 text-sm text-red-600
                px-3 py-2 border border-red-200 rounded-lg hover:bg-red-50
                transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Image gallery */}
      {hasImages ? (
        <div className="mb-6">
          <img
            src={currentIssue.images[0]}
            alt={currentIssue.title}
            className="w-full h-64 object-cover rounded-xl border border-gray-100"
          />
          {currentIssue.images.length > 1 && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {currentIssue.images.slice(1).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Image ${i + 2}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-100"
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div
          className="w-full h-56 bg-gray-50 rounded-xl flex items-center
          justify-center mb-6 border border-gray-100"
        >
          <CategoryIcon size={48} className="text-gray-200" />
        </div>
      )}

      {/* Main content card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span
            className={`flex items-center gap-1.5 text-xs font-medium
            px-3 py-1.5 rounded-full ${status.className}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          <span
            className={`text-xs font-medium px-3 py-1.5 rounded-full
            ${priority.className}`}
          >
            {priority.label} priority
          </span>
          <span
            className="text-xs font-medium text-gray-600 bg-gray-100
            px-3 py-1.5 rounded-full"
          >
            {currentIssue.category}
          </span>
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-3 leading-snug">
          {currentIssue.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-5">
          <span className="flex items-center gap-1.5">
            <User size={13} />
            {currentIssue.author?.name ?? "Anonymous"}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={13} />
            {timeAgo(currentIssue.createdAt)}
          </span>
          {hasAddress && (
            <span className="flex items-center gap-1.5">
              <MapPin size={13} />
              <span className="truncate max-w-xs">
                {currentIssue.location.address}
              </span>
            </span>
          )}
        </div>

        <div className="border-t border-gray-100 mb-5" />

        {/* Description */}
        <h2 className="text-sm font-medium text-gray-700 mb-2">Description</h2>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap mb-6">
          {currentIssue.description}
        </p>

        {/* ── Upvote section — Phase 8 ─────────────────────────────────────
            Sits between description and map. The detail variant is wider and
            shows "Upvoted" / "Upvote" text alongside the count.            */}
        <div className="border-t border-gray-100 pt-5">
          <div className="flex items-center gap-4">
            <UpvoteButton issue={currentIssue} variant="detail" />
            <p className="text-xs text-gray-400">
              {currentIssue.upvoterIds?.length === 1
                ? "1 person supports this report"
                : `${currentIssue.upvoterIds?.length ?? 0} people support this report`}
            </p>
          </div>
        </div>

        {/* MiniMap */}
        {hasCoords && (
          <div className="mt-6">
            <h2 className="text-sm font-medium text-gray-700 mb-2">Location</h2>
            <MiniMap
              lat={currentIssue.location.lat}
              lng={currentIssue.location.lng}
            />
            {hasAddress && (
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                {currentIssue.location.address}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Details card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-4">
          Issue details
        </h2>
        <dl>
          {[
            {
              label: "Issue ID",
              value: `#${currentIssue._id.slice(-8).toUpperCase()}`,
            },
            { label: "Category", value: currentIssue.category },
            { label: "Status", value: status.label },
            { label: "Priority", value: priority.label },
            { label: "Upvotes", value: currentIssue.upvoterIds?.length ?? 0 },
            {
              label: "Latitude",
              value: hasCoords ? currentIssue.location.lat.toFixed(6) : "—",
            },
            {
              label: "Longitude",
              value: hasCoords ? currentIssue.location.lng.toFixed(6) : "—",
            },
            {
              label: "Province",
              value: currentIssue.location?.province || "—",
            },
            {
              label: "District",
              value: currentIssue.location?.district || "—",
            },
            { label: "Ward", value: currentIssue.location?.ward || "—" },
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
                  month: "long",
                  day: "numeric",
                },
              ),
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex justify-between items-center
              py-2.5 border-b border-gray-50 last:border-0"
            >
              <dt className="text-xs text-gray-400">{label}</dt>
              <dd className="text-xs font-medium text-gray-700">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Delete confirm dialog */}
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
};

export default IssueDetailPage;
