import { useState } from "react";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore.js";
import useIssueStore from "../../store/useIssueStore.js";

// UpvoteButton — renders the heart icon + count with optimistic toggle behaviour.
//
// Props:
//   issue    — the full issue object (needs _id and upvoterIds)
//   variant  — "overlay"  : small white pill (used on the IssueCard image)
//              "detail"   : larger standalone button (used on IssueDetailPage)
//
// The parent doesn't need to pass any callback — this component reads and
// writes to the Zustand store directly, which immediately syncs every
// rendered card and the detail page with no extra wiring.
const UpvoteButton = ({ issue, variant = "overlay" }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { upvoteIssue } = useIssueStore();

  // Local loading flag prevents double-clicks during the API call.
  // We don't use the store's global isLoading because that would disable
  // every button on the page while one request is in flight.
  const [isPending, setIsPending] = useState(false);

  // Normalise upvoterIds to strings for reliable comparison.
  const upvoterIds = issue.upvoterIds ?? [];
  const idStr = (id) => (typeof id === "string" ? id : id?.toString());
  const isUpvoted = !!user && upvoterIds.some((id) => idStr(id) === user._id);
  const count = upvoterIds.length;

  const handleClick = async (e) => {
    // Stop click bubbling — the card itself may be wrapped in a Link.
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Sign in to upvote issues");
      navigate("/login");
      return;
    }

    if (isPending) return;
    setIsPending(true);

    try {
      // currentUserId is passed to the store action so it doesn't need
      // to import useAuthStore itself (avoids potential circular imports).
      await upvoteIssue(issue._id, user._id);
    } catch {
      // The store already rolled back the optimistic update.
      toast.error("Failed to upvote. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  // ── Overlay variant (on image, IssueCard) ─────────────────────────────────
  if (variant === "overlay") {
    return (
      <button
        onClick={handleClick}
        disabled={isPending}
        className={`flex items-center gap-1 text-xs font-medium px-2 py-1
          rounded-full shadow-sm transition-all duration-150 disabled:opacity-60
          ${
            isUpvoted
              ? "bg-green-500 text-white"
              : "bg-white/90 text-gray-500 hover:bg-white hover:text-green-600"
          }`}
      >
        <Heart size={11} className={isUpvoted ? "fill-white text-white" : ""} />
        {count}
      </button>
    );
  }

  // ── Detail variant (IssueDetailPage) ──────────────────────────────────────
  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border
        font-medium text-sm transition-all duration-150 disabled:opacity-60
        ${
          isUpvoted
            ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            : "bg-white border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-600 hover:bg-green-50"
        }`}
    >
      <Heart
        size={18}
        className={`transition-all duration-150
          ${isUpvoted ? "fill-green-500 text-green-500" : "text-gray-400"}`}
      />
      <span>{isUpvoted ? "Upvoted" : "Upvote"}</span>
      <span
        className={`px-2 py-0.5 rounded-full text-xs
        ${isUpvoted ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
      >
        {count}
      </span>
    </button>
  );
};

export default UpvoteButton;
