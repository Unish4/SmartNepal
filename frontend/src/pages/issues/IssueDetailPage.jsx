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

// IssueDetailPage — full detail view for a single issue.
// Public — anyone can view without logging in.
const IssueDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentIssue, isLoading, error, getIssueById } = useIssueStore();

  // Fetch the issue when the ID param changes (e.g. navigating
  useEffect(() => {
    getIssueById(id);
  }, [id, getIssueById]);

  // ── Loading skeleton
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse">
        <div className="h-4 w-32 bg-gray-100 rounded mb-6" />
        <div className="h-64 bg-gray-100 rounded-xl mb-6" />
        <div className="space-y-3">
          <div className="h-5 w-3/4 bg-gray-100 rounded" />
          <div className="h-4 w-full bg-gray-100 rounded" />
          <div className="h-4 w-5/6 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  // ── Error state
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

  return (
    <div className="max-w-3xl mx-auto">
      {/* ── Back navigation  */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500
          hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to issues
      </button>

      {/* ── Image / placeholder  */}
      <div
        className="w-full h-56 bg-gray-50 rounded-xl flex items-center
        justify-center mb-6 border border-gray-100"
      >
        <CategoryIcon size={48} className="text-gray-200" />
      </div>

      {/* ── Main content card  */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        {/* Badges row */}
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
          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
            {currentIssue.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-xl font-semibold text-gray-900 mb-3 leading-snug">
          {currentIssue.title}
        </h1>

        {/* Meta row */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-5">
          <span className="flex items-center gap-1.5">
            <User size={13} />
            Reported by {currentIssue.author?.name ?? "Anonymous"}
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

        {/* Divider */}
        <div className="border-t border-gray-100 mb-5" />

        {/* Description */}
        <h2 className="text-sm font-medium text-gray-700 mb-2">Description</h2>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
          {currentIssue.description}
        </p>
      </div>

      {/* ── Issue details sidebar card  */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-4">
          Issue details
        </h2>
        <dl className="space-y-3">
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
              className="flex justify-between items-center py-2
              border-b border-gray-50 last:border-0"
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
