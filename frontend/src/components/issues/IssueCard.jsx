import { Link } from "react-router-dom";
import { MapPin, AlertCircle } from "lucide-react";
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  CATEGORY_ICONS,
} from "../../constants/issue.js";
import { timeAgo } from "../../utils/timeAgo.js";
import UpvoteButton from "./UpvoteButton.jsx";

const IssueCard = ({ issue }) => {
  const status = STATUS_CONFIG[issue.status] || STATUS_CONFIG.open;
  const priority = PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.low;
  const CategoryIcon = CATEGORY_ICONS[issue.category] || AlertCircle;

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden
      hover:shadow-md hover:border-gray-200 transition-all duration-150 flex flex-col"
    >
      {/* Image area */}
      <div className="relative h-40 bg-gray-50 flex-shrink-0 overflow-hidden">
        {issue.images?.[0] ? (
          <img
            src={issue.images[0]}
            alt={issue.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CategoryIcon size={36} className="text-gray-200" />
          </div>
        )}

        {/* Status badge — top left */}
        <span
          className={`absolute top-3 left-3 flex items-center gap-1.5
          text-xs font-medium px-2.5 py-1 rounded-full ${status.className}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>

        {/* Upvote button — top right, overlay variant, now fully functional */}
        <div className="absolute top-3 right-3">
          <UpvoteButton issue={issue} variant="overlay" />
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category + Priority */}
        <div className="flex items-center gap-2 mb-2.5">
          <span
            className="text-xs font-medium text-gray-600 bg-gray-100
            px-2.5 py-1 rounded-full"
          >
            {issue.category}
          </span>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full
            ${priority.className}`}
          >
            {priority.label}
          </span>
        </div>

        <h3 className="text-sm font-semibold text-gray-900 mb-1.5 line-clamp-2 leading-snug">
          {issue.title}
        </h3>

        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3 flex-1">
          {issue.description}
        </p>

        {issue.location?.address && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
            <MapPin size={11} className="flex-shrink-0" />
            <span className="truncate">{issue.location.address}</span>
          </div>
        )}

        {/* Footer */}
        <div
          className="border-t border-gray-100 pt-3 flex items-center
          justify-between mt-auto"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full bg-green-100 flex items-center
              justify-center flex-shrink-0"
            >
              <span className="text-xs font-semibold text-green-700">
                {issue.author?.name?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
            <span className="text-xs text-gray-500 truncate max-w-[80px]">
              {issue.author?.name ?? "Anonymous"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              {timeAgo(issue.createdAt)}
            </span>
            <Link
              to={`/issues/${issue._id}`}
              className="text-xs text-green-600 hover:text-green-700
                font-medium hover:underline flex-shrink-0"
            >
              View →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueCard;
