import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  ClipboardList,
  MapPin,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import useIssueStore from "../../store/useIssueStore.js";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "../../constants/issue.js";
import { timeAgo } from "../../utils/timeAgo.js";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import IssueCardSkeleton from "../../components/issues/IssueCardSkeleton.jsx";

const MyIssuesPage = () => {
  const navigate = useNavigate();
  const {
    myIssues,
    myIssuesPagination,
    isLoading,
    error,
    getMyIssues,
    deleteIssue,
  } = useIssueStore();

  // Track which issue is pending deletion in the ConfirmDialog.
  // null means the dialog is closed.
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getMyIssues({ page: 1, limit: 10 });
  }, [getMyIssues]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteIssue(deleteTarget._id);
      toast.success("Issue deleted successfully");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete issue");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Reports</h1>
          {myIssuesPagination && (
            <p className="text-sm text-gray-500 mt-1">
              {myIssuesPagination.total} issue
              {myIssuesPagination.total !== 1 ? "s" : ""} reported by you
            </p>
          )}
        </div>
        <Link
          to="/issues/new"
          className="flex items-center gap-2 bg-green-600 text-white text-sm
            font-medium px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus size={16} />
          New Report
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 text-sm
          rounded-lg p-4 mb-5"
        >
          {error}
        </div>
      )}

      {/* Issue list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <IssueCardSkeleton key={i} />
          ))}
        </div>
      ) : myIssues.length > 0 ? (
        <div className="space-y-3">
          {myIssues.map((issue) => {
            const status = STATUS_CONFIG[issue.status] || STATUS_CONFIG.open;
            const priority =
              PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.low;

            return (
              <div
                key={issue._id}
                className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm
                  hover:border-gray-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: issue info */}
                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        className={`flex items-center gap-1.5 text-xs font-medium
                        px-2.5 py-1 rounded-full ${status.className}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${status.dot}`}
                        />
                        {status.label}
                      </span>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full
                        ${priority.className}`}
                      >
                        {priority.label}
                      </span>
                      <span
                        className="text-xs font-medium text-gray-600 bg-gray-100
                        px-2.5 py-1 rounded-full"
                      >
                        {issue.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      className="text-sm font-semibold text-gray-900 mb-1.5
                      truncate"
                    >
                      {issue.title}
                    </h3>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      {issue.location?.address && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} />
                          <span className="truncate max-w-40">
                            {issue.location.address}
                          </span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {timeAgo(issue.createdAt)}
                      </span>
                      <span>{issue.upvoterIds?.length ?? 0} upvotes</span>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/issues/${issue._id}`}
                      className="text-xs text-gray-500 hover:text-gray-800
                        px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50
                        transition-colors"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => navigate(`/issues/${issue._id}/edit`)}
                      className="flex items-center gap-1.5 text-xs text-blue-600
                        px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50
                        transition-colors"
                    >
                      <Pencil size={12} />
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        setDeleteTarget({ _id: issue._id, title: issue.title })
                      }
                      className="flex items-center gap-1.5 text-xs text-red-600
                        px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50
                        transition-colors"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Empty state
        <div className="flex flex-col items-center text-center py-20">
          <div
            className="w-16 h-16 bg-gray-100 rounded-full flex items-center
            justify-center mb-4"
          >
            <ClipboardList size={24} className="text-gray-400" />
          </div>
          <h3 className="text-gray-900 font-medium mb-1">No reports yet</h3>
          <p className="text-gray-500 text-sm mb-5">
            You haven't reported any civic issues yet.
          </p>
          <Link
            to="/issues/new"
            className="bg-green-600 text-white text-sm font-medium px-5 py-2.5
              rounded-lg hover:bg-green-700 transition-colors"
          >
            Report your first issue
          </Link>
        </div>
      )}

      {/* Pagination */}
      {myIssuesPagination && myIssuesPagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            disabled={!myIssuesPagination.hasPrev || isLoading}
            onClick={() => getMyIssues({ page: myIssuesPagination.page - 1 })}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg
              hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {myIssuesPagination.page} of {myIssuesPagination.pages}
          </span>
          <button
            disabled={!myIssuesPagination.hasNext || isLoading}
            onClick={() => getMyIssues({ page: myIssuesPagination.page + 1 })}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg
              hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete this report?"
        description={`"${deleteTarget?.title}" will be permanently removed. This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => !isDeleting && setDeleteTarget(null)}
      />
    </div>
  );
};

export default MyIssuesPage;
