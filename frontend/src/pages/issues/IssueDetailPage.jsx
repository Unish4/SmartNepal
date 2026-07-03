import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, User, AlertCircle } from "lucide-react";
import useIssueStore from "../../store/useIssueStore.js";
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  CATEGORY_ICONS,
} from "../../constants/issue.js";
import { timeAgo } from "../../utils/timeAgo.js";

const IssueDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentIssue, isLoading, error, getIssueById } = useIssueStore();

  useEffect(() => {
    getIssueById(id);
  }, [id, getIssueById]);

  // ── Loading skeleton
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

  // ── Error / not found
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

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500
          hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to issues
      </button>

      {/* ── Image gallery 
          Phase 5: show real Cloudinary images.
          Cover image is full width. Additional images in a thumbnail row. */}
      {hasImages ? (
        <div className="mb-6">
          <img
            src={currentIssue.images[0]}
            alt={currentIssue.title}
            className="w-full h-64 object-cover rounded-xl border border-gray-100"
          />
          {/* Thumbnail strip for images 2 and 3 */}
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
        // No images — category icon placeholder
        <div
          className="w-full h-56 bg-gray-50 rounded-xl flex items-center
          justify-center mb-6 border border-gray-100"
        >
          <CategoryIcon size={48} className="text-gray-200" />
        </div>
      )}

      {/* ── Main content card  */}
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
            className={`text-xs font-medium px-3 py-1.5 rounded-full ${priority.className}`}
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

        {/* Title */}
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
          {currentIssue.location?.address && (
            <span className="flex items-center gap-1.5">
              <MapPin size={13} />
              {currentIssue.location.address}
            </span>
          )}
        </div>

        <div className="border-t border-gray-100 mb-5" />

        {/* Description */}
        <h2 className="text-sm font-medium text-gray-700 mb-2">Description</h2>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
          {currentIssue.description}
        </p>
      </div>

      {/* ── Details sidebar card  */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-4">
          Issue details
        </h2>
        <dl className="space-y-0">
          {[
            {
              label: "Issue ID",
              value: `#${currentIssue._id.slice(-8).toUpperCase()}`,
            },
            { label: "Category", value: currentIssue.category },
            { label: "Status", value: status.label },
            { label: "Priority", value: priority.label },
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
    </div>
  );
};

export default IssueDetailPage;
