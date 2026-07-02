import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, ClipboardList } from "lucide-react";
import useIssueStore from "../../store/useIssueStore.js";
import useAuthStore from "../../store/useAuthStore.js";
import IssueCard from "../../components/issues/IssueCard.jsx";
import IssueCardSkeleton from "../../components/issues/IssueCardSkeleton.jsx";

const IssuesPage = () => {
  const { issues, pagination, isLoading, error, getIssues } = useIssueStore();
  const { isAuthenticated } = useAuthStore();

  // Fetch issues when the page mounts.
  useEffect(() => {
    getIssues({ page: 1, limit: 12 });
  }, [getIssues]);

  return (
    <div>
      {/* ── Page header  */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Community Issues
          </h1>
          {pagination && (
            <p className="text-sm text-gray-500 mt-1">
              {pagination.total} issue{pagination.total !== 1 ? "s" : ""}{" "}
              reported
            </p>
          )}
        </div>

        {/* Only show report button to logged-in users */}
        {isAuthenticated && (
          <Link
            to="/issues/new"
            className="flex items-center gap-2 bg-green-600 text-white text-sm
              font-medium px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={16} />
            Report an Issue
          </Link>
        )}
      </div>

      {/* ── Error state  */}
      {error && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 text-sm
          rounded-lg p-4 mb-6"
        >
          {error}
        </div>
      )}

      {/* ── Issue grid  */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          // Show 6 skeleton cards while loading
          Array.from({ length: 6 }).map((_, i) => <IssueCardSkeleton key={i} />)
        ) : issues.length > 0 ? (
          issues.map((issue) => <IssueCard key={issue._id} issue={issue} />)
        ) : (
          // Empty state — shown when there are genuinely no issues yet
          <div className="col-span-full flex flex-col items-center text-center py-20">
            <div
              className="w-16 h-16 bg-gray-100 rounded-full flex items-center
                justify-center mb-4"
            >
              <ClipboardList size={24} className="text-gray-400" />
            </div>
            <h3 className="text-gray-900 font-medium mb-1">
              No issues reported yet
            </h3>
            <p className="text-gray-500 text-sm mb-5">
              Be the first to report a civic issue in your community.
            </p>
            {isAuthenticated && (
              <Link
                to="/issues/new"
                className="bg-green-600 text-white text-sm font-medium
                    px-5 py-2.5 rounded-lg hover:bg-green-700 transition-colors"
              >
                Report an issue
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Pagination  */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            disabled={!pagination.hasPrev}
            onClick={() => getIssues({ page: pagination.page - 1 })}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg
              hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <span className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.pages}
          </span>

          <button
            disabled={!pagination.hasNext}
            onClick={() => getIssues({ page: pagination.page + 1 })}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg
              hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default IssuesPage;
