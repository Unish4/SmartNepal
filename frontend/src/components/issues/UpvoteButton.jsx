import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore.js";
import useIssueStore from "../../store/useIssueStore.js";

const UpvoteButton = ({ issue, variant = "overlay" }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { upvoteIssue } = useIssueStore();
  const [isPending, setIsPending] = useState(false);

  const upvoterIds = issue.upvoterIds ?? [];
  const idStr = (id) => (typeof id === "string" ? id : id?.toString());
  const isUpvoted = !!user && upvoterIds.some((id) => idStr(id) === user._id);
  const count = upvoterIds.length;

  const handleClick = async (e) => {
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
      await upvoteIssue(issue._id, user._id);
    } catch {
      toast.error("Failed to upvote. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  if (variant === "overlay") {
    return (
      <button
        onClick={handleClick}
        disabled={isPending}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
          backdrop-blur-sm transition-all disabled:opacity-60
          ${isUpvoted ? "bg-[#16a34a] text-white" : "bg-white/85 text-[#475569] hover:bg-white"}`}
      >
        <ThumbsUp size={10} className={isUpvoted ? "fill-white" : ""} />
        {count}
      </button>
    );
  }

  // Detail variant
  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`flex items-center gap-2 h-10 px-5 rounded-lg border font-medium
        text-sm transition-all disabled:opacity-60
        ${
          isUpvoted
            ? "bg-[#f0fdf4] border-[#86efac] text-[#16a34a]"
            : "border-[#e2e8f0] text-[#475569] hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
        }`}
    >
      <ThumbsUp size={15} className={isUpvoted ? "fill-[#16a34a]" : ""} />
      {count} {count === 1 ? "person supports" : "people support"} this
    </button>
  );
};

export default UpvoteButton;
