import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, X, ChevronDown } from "lucide-react";
import { fetchAllIssues } from "../../services/adminService.js";
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  CATEGORIES,
} from "../../constants/issue.js";
import { timeAgo } from "../../utils/timeAgo.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import StatusUpdateModal from "../admin/StatusUpdateModal.jsx";
import { TableRowSkeleton } from "../../components/ui/SkeletonLoader.jsx";

const AdminIssuesPage = () => {
  const [issues, setIssues] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [editingIssue, setEditingIssue] = useState(null);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    let isMounted = true;

    const loadIssues = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = { page, limit: 15 };
        if (debouncedSearch) params.search = debouncedSearch;
        if (category) params.category = category;
        if (statusFilter) params.status = statusFilter;
        const res = await fetchAllIssues(params);
        if (isMounted) {
          setIssues(res.issues);
          setPagination(res.pagination);
        }
      } catch {
        if (isMounted) {
          setError("Failed to load issues");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadIssues();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, category, statusFilter, page]);

  // In-place row update after status change — no full refetch needed
  const handleIssueUpdated = (updatedIssue) => {
    setIssues((prev) =>
      prev.map((i) => (i._id === updatedIssue._id ? updatedIssue : i)),
    );
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setStatusFilter("");
    setPage(1);
  };
  const hasFilters = !!(search || category || statusFilter);

  return (
    <div>
      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
            All Issues
          </h1>
          {pagination && (
            <p className="text-sm text-[#64748b] mt-1">
              {pagination.total} total report{pagination.total !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-4 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-45">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search issues…"
              className="w-full h-9 pl-8 pr-8 text-sm border border-[#e2e8f0] rounded-lg
                outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15
                text-[#0f172a] placeholder:text-[#94a3b8] transition-all"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8]
                  hover:text-[#475569] transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Category */}
          <div className="relative">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className={`h-9 pl-3 pr-7 text-sm border rounded-lg bg-white outline-none
                cursor-pointer appearance-none transition-all
                ${
                  category
                    ? "border-[#16a34a] text-[#16a34a] bg-[#f0fdf4]"
                    : "border-[#e2e8f0] text-[#475569] hover:border-[#cbd5e1]"
                }`}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none
                ${category ? "text-[#16a34a]" : "text-[#94a3b8]"}`}
            />
          </div>

          {/* Status */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className={`h-9 pl-3 pr-7 text-sm border rounded-lg bg-white outline-none
                cursor-pointer appearance-none transition-all
                ${
                  statusFilter
                    ? "border-[#16a34a] text-[#16a34a] bg-[#f0fdf4]"
                    : "border-[#e2e8f0] text-[#475569] hover:border-[#cbd5e1]"
                }`}
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="verified">Verified</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
            <ChevronDown
              size={12}
              className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none
                ${statusFilter ? "text-[#16a34a]" : "text-[#94a3b8]"}`}
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 h-9 px-3 text-xs font-medium
                text-red-500 border border-red-200 rounded-lg hover:bg-red-50
                transition-colors"
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────── */}
      {error && (
        <div
          className="bg-red-50 border-l-4 border-red-500 text-red-700 text-sm
          rounded-lg p-4 mb-4"
        >
          {error}
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                {[
                  "Title",
                  "Category",
                  "Status",
                  "Priority",
                  "Reporter",
                  "↑",
                  "Date",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[10px] font-semibold text-[#94a3b8]
                      uppercase tracking-widest px-4 py-3 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f8fafc]">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRowSkeleton key={i} colCount={8} />
                ))
              ) : issues.length > 0 ? (
                issues.map((issue) => {
                  const st = STATUS_CONFIG[issue.status] || STATUS_CONFIG.open;
                  const pr =
                    PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.low;
                  return (
                    <tr
                      key={issue._id}
                      className="hover:bg-[#f8fafc] transition-colors"
                    >
                      {/* Title */}
                      <td className="px-4 py-3.5" style={{ maxWidth: 220 }}>
                        <p className="text-sm font-semibold text-[#0f172a] truncate">
                          {issue.title}
                        </p>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className="text-xs font-medium text-[#475569]
                          bg-[#f1f5f9] px-2.5 py-1 rounded-full"
                        >
                          {issue.category}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1
                            rounded-full text-xs font-semibold"
                          style={{ backgroundColor: st.bg, color: st.text }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: st.dot }}
                          />
                          {st.label}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1
                            rounded text-xs font-semibold"
                          style={{ backgroundColor: pr.bg, color: pr.color }}
                        >
                          {pr.label}
                        </span>
                      </td>

                      {/* Reporter */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full bg-[#f0fdf4] text-[#16a34a]
                            font-semibold text-[10px] border border-[#bbf7d0]
                            flex items-center justify-center shrink-0"
                          >
                            {issue.author?.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <p className="text-xs text-[#475569] truncate max-w-25">
                            {issue.author?.name ?? "—"}
                          </p>
                        </div>
                      </td>

                      {/* Upvotes */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-xs font-medium text-[#64748b]">
                          {issue.upvoterIds?.length ?? 0}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-xs text-[#94a3b8]">
                          {timeAgo(issue.createdAt)}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Link
                            to={`/issues/${issue._id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[#16a34a] hover:underline font-medium"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => setEditingIssue(issue)}
                            className="text-xs text-blue-600 hover:underline font-medium"
                          >
                            Status
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-16 text-center text-sm text-[#94a3b8]"
                  >
                    No issues match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table pagination */}
        {pagination && pagination.pages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3.5
            border-t border-[#e2e8f0]"
          >
            <p className="text-xs text-[#94a3b8]">
              Page {pagination.page} of {pagination.pages} · {pagination.total}{" "}
              total
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={!pagination.hasPrev}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-xs font-medium border border-[#e2e8f0]
                  rounded-lg hover:bg-[#f8fafc] text-[#475569] disabled:opacity-40
                  disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              <button
                disabled={!pagination.hasNext}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs font-medium border border-[#e2e8f0]
                  rounded-lg hover:bg-[#f8fafc] text-[#475569] disabled:opacity-40
                  disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status update modal */}
      {editingIssue && (
        <StatusUpdateModal
          issue={editingIssue}
          onClose={() => setEditingIssue(null)}
          onUpdated={handleIssueUpdated}
        />
      )}
    </div>
  );
};

export default AdminIssuesPage;
