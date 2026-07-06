import { Link } from "react-router-dom";
import { MapPin, Eye, AlertCircle, ThumbsUp } from "lucide-react";
import {
  CATEGORY_CONFIG,
  CATEGORY_ICONS,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
} from "../../constants/issue.js";
import { timeAgo } from "../../utils/timeAgo.js";
import UpvoteButton from "./UpvoteButton.jsx";

// CategoryBadge — icon + label, category-specific colour
const CategoryBadge = ({ category }) => {
  const Icon = CATEGORY_ICONS[category] || AlertCircle;
  const c = CATEGORY_CONFIG[category] || CATEGORY_CONFIG["Other"];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      <Icon size={10} />
      {category}
    </span>
  );
};

// PriorityBadge — pulsing dot for critical
const PriorityBadge = ({ priority }) => {
  const c = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.low;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      {c.pulse ? (
        <span className="relative flex w-1.5 h-1.5 shrink-0">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
            style={{ backgroundColor: c.color }}
          />
          <span
            className="relative inline-flex rounded-full w-1.5 h-1.5"
            style={{ backgroundColor: c.color }}
          />
        </span>
      ) : (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: c.color }}
        />
      )}
      {c.label}
    </span>
  );
};

const IssueCard = ({ issue }) => {
  const st = STATUS_CONFIG[issue.status] || STATUS_CONFIG.open;
  const CategoryIcon = CATEGORY_ICONS[issue.category] || AlertCircle;

  return (
    <Link
      to={`/issues/${issue._id}`}
      className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden
        hover:shadow-lg hover:border-[#cbd5e1] hover:-translate-y-0.5
        transition-all duration-200 group flex flex-col"
    >
      {/* Image */}
      <div className="relative h-45 bg-slate-100 overflow-hidden shrink-0">
        {issue.images?.[0] ? (
          <img
            src={issue.images[0]}
            alt={issue.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#f8fafc]">
            <CategoryIcon size={36} className="text-[#e2e8f0]" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/10 to-transparent" />

        {/* Status badge — top left */}
        <div className="absolute top-2.5 left-2.5">
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
        </div>

        {/* Upvote — top right */}
        <div className="absolute top-2.5 right-2.5">
          <UpvoteButton issue={issue} variant="overlay" />
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          <CategoryBadge category={issue.category} />
          <PriorityBadge priority={issue.priority} />
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-[#0f172a] leading-snug line-clamp-2 mb-1.5">
          {issue.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-[#64748b] line-clamp-2 leading-relaxed mb-3 flex-1">
          {issue.description}
        </p>

        {/* Location + time */}
        <div className="flex items-center justify-between text-xs text-[#94a3b8] mb-3">
          <span className="flex items-center gap-1 truncate">
            <MapPin size={10} className="shrink-0" />
            <span className="truncate">
              {issue.location?.address || "Location not set"}
            </span>
          </span>
          <span className="shrink-0 ml-2">{timeAgo(issue.createdAt)}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#f1f5f9]">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-7 h-7 rounded-full bg-[#f0fdf4] text-[#16a34a] font-semibold
              text-xs border border-[#bbf7d0] flex items-center justify-center shrink-0"
            >
              {issue.author?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <span className="text-xs text-[#64748b] truncate">
              {issue.author?.name ?? "Anonymous"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#94a3b8] shrink-0">
            <span className="flex items-center gap-1">
              <Eye size={10} />
              {issue.views ?? 0}
            </span>

            <span className="flex items-center gap-1">
              <ThumbsUp size={10} />
              {issue.upvoterIds?.length ?? 0}
            </span>
          </div>{" "}
        </div>
      </div>
    </Link>
  );
};

export default IssueCard;
