import { Link } from "react-router-dom";
import { MapPin, MessageSquare, Sparkles, AlertCircle } from "lucide-react";
import {
  CATEGORY_CONFIG,
  CATEGORY_ICONS,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
} from "../../constants/issue.js";
import { timeAgo } from "../../utils/timeAgo.js";
import UpvoteButton from "./UpvoteButton.jsx";
import { useIssueLabels } from "../../hooks/useIssueLabels.js";
import { BadgeCheck } from "lucide-react";
import { hasBadge } from "../../utils/badgeUtils.js";

const CategoryBadge = ({ category }) => {
  const { getCategoryLabel } = useIssueLabels();
  const Icon = CATEGORY_ICONS[category] || AlertCircle;
  const c = CATEGORY_CONFIG[category] || CATEGORY_CONFIG["Other"];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded
      text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      <Icon size={10} />
      {getCategoryLabel(category)}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const { getPriorityLabel } = useIssueLabels();
  const c = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.low;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded
      text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      {c.pulse ? (
        <span className="relative flex w-1.5 h-1.5 shrink-0">
          <span
            className="animate-ping absolute inline-flex h-full w-full
            rounded-full opacity-60"
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
      {getPriorityLabel(priority)}
    </span>
  );
};

const IssueCard = ({ issue }) => {
  const st = STATUS_CONFIG[issue.status] || STATUS_CONFIG.open;
  const { getStatusLabel } = useIssueLabels();
  const CategoryIcon = CATEGORY_ICONS[issue.category] || AlertCircle;

  const showAIBadge = !!(issue.aiCategory && issue.aiConfidence != null);

  return (
    <div
      className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden
        hover:shadow-lg hover:border-[#cbd5e1] hover:-translate-y-0.5
        transition-all duration-200 group flex flex-col relative"
    >
      {/* Image area */}
      <div className="relative h-45 bg-slate-100 overflow-hidden shrink-0">
        {issue.images?.[0] ? (
          <img
            src={issue.images[0]}
            alt={issue.title}
            className="w-full h-full object-cover group-hover:scale-[1.03]
              transition-transform duration-300"
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
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full
            text-xs font-medium"
            style={{ backgroundColor: st.bg, color: st.text }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: st.dot }}
            />
            {getStatusLabel(issue.status)}
          </span>
        </div>

        {/* Upvote button — top right */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <UpvoteButton issue={issue} variant="overlay" />
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Badges row — category + priority + AI badge */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          <CategoryBadge category={issue.category} />
          <PriorityBadge priority={issue.priority} />
          {/* AI badge — only rendered when Gemini successfully categorized the issue */}
          {showAIBadge && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
              text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100"
            >
              <Sparkles size={9} />
              AI · {issue.aiConfidence}%
            </span>
          )}
        </div>

        <h3
          className="text-sm font-semibold text-[#0f172a] leading-snug
          line-clamp-2 mb-1.5"
        >
          <Link
            to={`/issues/${issue._id}`}
            className="hover:text-[#16a34a] transition-colors after:absolute after:inset-0 after:z-0"
          >
            {issue.title}
          </Link>
        </h3>

        <p className="text-xs text-[#64748b] line-clamp-2 leading-relaxed mb-3 flex-1">
          {issue.description}
        </p>

        <div className="flex items-center justify-between text-xs text-[#64748b] mb-3">
          <span className="flex items-center gap-1 truncate">
            <MapPin size={10} className="shrink-0" />
            <span className="truncate">
              {issue.location?.address || "Location not set"}
            </span>
          </span>
          <span className="shrink-0 ml-2">{timeAgo(issue.createdAt)}</span>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-3
          border-t border-[#f1f5f9]"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-7 h-7 rounded-full bg-[#f0fdf4] text-[#16a34a]
              font-semibold text-xs border border-[#bbf7d0] flex items-center
              justify-center shrink-0"
            >
              {issue.author?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <span className="text-xs text-[#64748b] truncate">
              {issue.author?.name ?? "Anonymous"}
              {hasBadge(issue.author, "verified_reporter") && (
                <BadgeCheck size={11} className="text-teal-600 shrink-0" />
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#94a3b8] shrink-0">
            <span className="flex items-center gap-1">
              <MessageSquare size={10} />
              {issue.messageCount ?? issue.commentCount ?? 0}
            </span>
          </div>{" "}
        </div>
      </div>
    </div>
  );
};

export default IssueCard;
