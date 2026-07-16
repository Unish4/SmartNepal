import { useEffect, useState } from "react";
import { MessageSquare, Send, Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchComments,
  createCommentRequest,
  deleteCommentRequest,
} from "../../services/commentService.js";
import useAuthStore from "../../store/useAuthStore.js";
import { timeAgo } from "../../utils/timeAgo.js";
import ConfirmDialog from "../ui/ConfirmDialog.jsx";

// Self-contained — takes only an issueId prop and manages its own
// fetch/create/delete state, so it can be dropped into IssueDetailPage
// without that page needing to know anything about comment internals.
const CommentThread = ({ issueId }) => {
  const { user, isAuthenticated } = useAuthStore();
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    
    // Set loading asynchronously to avoid synchronous setState inside useEffect warning
    const timeoutId = setTimeout(() => {
      if (active) setIsLoading(true);
    }, 0);

    fetchComments(issueId)
      .then((res) => {
        if (active) setComments(res.comments);
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(timeoutId);
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [issueId]);

  const isModerator = user?.role === "admin" || user?.role === "super_admin";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await createCommentRequest(issueId, text.trim());
      setComments((prev) => [...prev, res.comment]);
      setText("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!commentToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCommentRequest(issueId, commentToDelete);
      setComments((prev) => prev.filter((c) => c._id !== commentToDelete));
      toast.success("Comment removed");
      setCommentToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete comment");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={15} className="text-[#16a34a]" />
        <h2 className="text-sm font-semibold text-[#0f172a]">
          Discussion {comments.length > 0 && `(${comments.length})`}
        </h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-12 bg-[#f1f5f9] rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4 mb-5">
          {comments.map((c) => {
            const canDelete =
              isAuthenticated && (user?._id === c.author?._id || isModerator);
            return (
              <div key={c._id} className="flex items-start gap-2.5">
                <div
                  className="w-7 h-7 rounded-full bg-[#f0fdf4] border border-[#bbf7d0]
                  flex items-center justify-center shrink-0 text-xs font-semibold text-[#16a34a]"
                >
                  {c.author?.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-[#0f172a]">
                      {c.author?.name ?? "Anonymous"}
                    </p>
                    <p className="text-[10px] text-[#94a3b8]">
                      {timeAgo(c.createdAt)}
                    </p>
                  </div>
                  <p className="text-sm text-[#475569] mt-0.5 leading-relaxed whitespace-pre-wrap">
                    {c.text}
                  </p>
                </div>
                {canDelete && (
                  <button
                    onClick={() => setCommentToDelete(c._id)}
                    className="text-[#94a3b8] hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all shrink-0 cursor-pointer"
                    title="Delete comment"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-[#94a3b8] mb-5">
          No comments yet. Be the first to add context.
        </p>
      )}

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="flex items-start gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment — is this happening near you too?"
            rows={2}
            maxLength={1000}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-[#e2e8f0]
              placeholder:text-[#94a3b8] outline-none focus:border-[#16a34a]
              focus:ring-2 focus:ring-[#16a34a]/15 transition-all resize-none"
          />
          <button
            type="submit"
            disabled={isSubmitting || !text.trim()}
            className="h-9 px-3 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white
              flex items-center justify-center transition-colors disabled:opacity-50
              disabled:cursor-not-allowed shrink-0"
          >
            {isSubmitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
          </button>
        </form>
      ) : (
        <p className="text-xs text-[#94a3b8] text-center py-2 border-t border-[#f1f5f9]">
          Sign in to join the discussion.
        </p>
      )}

      <ConfirmDialog
        isOpen={commentToDelete !== null}
        title="Delete this comment?"
        description="This comment will be permanently removed and cannot be recovered."
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => !isDeleting && setCommentToDelete(null)}
      />
    </div>
  );
};

export default CommentThread;
