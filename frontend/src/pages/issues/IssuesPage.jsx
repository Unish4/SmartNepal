import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  SlidersHorizontal,
} from "lucide-react";
import useIssueStore from "../../store/useIssueStore.js";
import useAuthStore from "../../store/useAuthStore.js";
import IssueCard from "../../components/issues/IssueCard.jsx";
import { IssueCardSkeleton } from "../../components/ui/SkeletonLoader.jsx";
import { useDebounce } from "../../hooks/useDebounce.js";
import { CATEGORIES } from "../../constants/issue.js";
import { fetchBoundaryOptions } from "../../services/issueService.js";

const STATUS_CHIPS = [
  { label: "All", value: "" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in-progress" },
  { label: "Resolved", value: "resolved" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Sort: Newest" },
  { value: "oldest", label: "Sort: Oldest" },
  { value: "most-upvoted", label: "Sort: Most Upvoted" },
];

const DEFAULT_FILTERS = {
  category: "",
  status: "",
  priority: "",
  sort: "newest",
  province: "",
  district: "", // ← Phase 17
};

function buildPages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3)
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}

export default function IssuesPage() {
  const { issues, pagination, isLoading, error, getIssues } = useIssueStore();
  const { isAuthenticated } = useAuthStore();

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  // Phase 17 — boundary options for province/district dropdowns
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);

  const debouncedSearch = useDebounce(search, 400);

  // Load province/district options once on mount
  useEffect(() => {
    fetchBoundaryOptions()
      .then((res) => {
        setProvinces(res.provinces || []);
        setDistricts(res.districts || []);
      })
      .catch(() => {
        // Non-critical — filters still work without the options preloaded
      });
  }, []);

  useEffect(() => {
    const params = { page, limit: 12 };
    if (debouncedSearch) params.search = debouncedSearch;
    if (filters.category) params.category = filters.category;
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.sort !== "newest") params.sort = filters.sort;
    if (filters.province) params.province = filters.province; // ← Phase 17
    if (filters.district) params.district = filters.district; // ← Phase 17
    getIssues(params);
  }, [
    debouncedSearch,
    filters.category,
    filters.status,
    filters.priority,
    filters.sort,
    filters.province,
    filters.district,
    page,
    getIssues,
  ]);

  const setFilter = (key, val) => {
    setFilters((p) => ({ ...p, [key]: val }));
    setPage(1);
  };
  const clearAll = () => {
    setSearch("");
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const hasFilters = !!(
    search ||
    filters.category ||
    filters.status ||
    filters.priority ||
    filters.province ||
    filters.district ||
    filters.sort !== "newest"
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* ── Sticky filter bar ──────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#e2e8f0] sticky top-16 z-30">
        {/* Row 1 — search + status chips */}
        <div
          className="max-w-7xl mx-auto px-6 pt-3 pb-2.5
          flex flex-wrap items-center gap-3"
        >
          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2
              text-[#94a3b8]"
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search issues, locations…"
              className="h-9 pl-9 pr-8 rounded-lg border border-[#e2e8f0] text-sm
                placeholder:text-[#94a3b8] text-[#0f172a] outline-none
                focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15
                transition-all"
              style={{ width: 340 }}
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2
                  text-[#94a3b8] hover:text-[#475569] transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {STATUS_CHIPS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setFilter("status", value)}
                className={`h-8 px-4 rounded-full text-xs font-semibold border
                  transition-all ${
                    filters.status === value
                      ? "bg-[#16a34a] text-white border-[#16a34a] shadow-sm"
                      : "bg-white text-[#475569] border-[#e2e8f0] hover:border-[#cbd5e1]"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2 — dropdowns */}
        <div
          className="max-w-7xl mx-auto px-6 pb-3 flex
          items-center gap-2 flex-wrap"
        >
          <SlidersHorizontal size={13} className="text-[#94a3b8] shrink-0" />

          {/* Category */}
          <FilterDropdown
            value={filters.category}
            onChange={(v) => setFilter("category", v)}
            active={!!filters.category}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </FilterDropdown>

          {/* Province ── Phase 17 ─ */}
          <FilterDropdown
            value={filters.province}
            onChange={(v) => {
              setFilter("province", v);
              setFilter("district", "");
            }}
            active={!!filters.province}
          >
            <option value="">All Provinces</option>
            {provinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </FilterDropdown>

          {/* District ── Phase 17 ─ */}
          <FilterDropdown
            value={filters.district}
            onChange={(v) => setFilter("district", v)}
            active={!!filters.district}
          >
            <option value="">All Districts</option>
            {/* Show all districts, or filter by selected province if we have the data */}
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </FilterDropdown>

          {/* Priority */}
          <FilterDropdown
            value={filters.priority}
            onChange={(v) => setFilter("priority", v)}
            active={!!filters.priority}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </FilterDropdown>

          {/* Sort */}
          <FilterDropdown
            value={filters.sort}
            onChange={(v) => setFilter("sort", v)}
            active={filters.sort !== "newest"}
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </FilterDropdown>

          {hasFilters && (
            <>
              {pagination && (
                <span className="text-xs text-[#94a3b8] ml-1">
                  {pagination.total} result{pagination.total !== 1 ? "s" : ""}
                </span>
              )}
              <button
                onClick={clearAll}
                className="h-8 px-3 text-xs font-medium text-[#64748b]
                  hover:text-[#0f172a] underline underline-offset-2 transition-colors"
              >
                Clear all filters
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[28px] font-bold text-[#0f172a] tracking-tight">
              Community Issues
            </h1>
            {pagination && !hasFilters && (
              <p className="text-sm text-[#64748b] mt-1">
                {pagination.total} issues reported
              </p>
            )}
            {(filters.province || filters.district) && (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {filters.district && (
                  <span
                    className="text-xs font-medium text-[#16a34a]
                    bg-[#f0fdf4] border border-[#bbf7d0] px-2.5 py-1 rounded-full"
                  >
                    📍 {filters.district}
                  </span>
                )}
                {filters.province && (
                  <span
                    className="text-xs font-medium text-[#475569]
                    bg-[#f8fafc] border border-[#e2e8f0] px-2.5 py-1 rounded-full"
                  >
                    {filters.province}
                  </span>
                )}
                {pagination && (
                  <span className="text-xs text-[#94a3b8]">
                    · {pagination.total} issue
                    {pagination.total !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}
          </div>
          {isAuthenticated && (
            <Link
              to="/issues/new"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg
                bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-sm
                transition-colors shadow-sm shrink-0"
            >
              <Plus size={15} /> Report an Issue
            </Link>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            className="bg-red-50 border-l-4 border-red-500 text-red-700
            text-sm rounded-lg p-4 mb-6"
          >
            {error}
          </div>
        )}

        {/* Issue grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <IssueCardSkeleton key={i} />
            ))
          ) : issues.length > 0 ? (
            issues.map((issue) => <IssueCard key={issue._id} issue={issue} />)
          ) : (
            <div
              className="col-span-full flex flex-col items-center
              justify-center py-24 text-center"
            >
              <div
                className="w-20 h-20 rounded-2xl bg-[#f1f5f9] flex items-center
                justify-center mb-5 border border-[#e2e8f0]"
              >
                <Search size={32} className="text-[#94a3b8]" />
              </div>
              {hasFilters ? (
                <>
                  <h3 className="text-lg font-semibold text-[#0f172a] mb-2">
                    No results found
                  </h3>
                  <p className="text-sm text-[#94a3b8] max-w-xs mb-6 leading-relaxed">
                    No issues match your current filters.
                    {(filters.province || filters.district) &&
                      " Try a different province or district."}
                  </p>
                  <button
                    onClick={clearAll}
                    className="h-10 px-6 rounded-lg bg-[#16a34a] hover:bg-[#15803d]
                      text-white text-sm font-semibold transition-colors"
                  >
                    Clear filters
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-[#0f172a] mb-2">
                    No issues reported yet
                  </h3>
                  <p className="text-sm text-[#94a3b8] max-w-xs mb-6">
                    Be the first to report a civic issue.
                  </p>
                  {isAuthenticated && (
                    <Link
                      to="/issues/new"
                      className="h-10 px-6 rounded-lg bg-[#16a34a] hover:bg-[#15803d]
                        text-white text-sm font-semibold transition-colors"
                    >
                      Report an issue
                    </Link>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-10 mb-4">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={!pagination.hasPrev}
              className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm
                font-medium text-[#475569] hover:bg-[#f8fafc]
                disabled:opacity-40 disabled:cursor-not-allowed
                flex items-center gap-1.5 transition-colors"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <div className="flex items-center gap-1 mx-2">
              {buildPages(page, pagination.pages).map((p, i) => (
                <button
                  key={i}
                  onClick={() => typeof p === "number" && setPage(p)}
                  disabled={p === "..."}
                  className={`w-9 h-9 rounded-lg text-sm font-medium
                    transition-colors ${
                      p === page
                        ? "bg-[#16a34a] text-white shadow-sm"
                        : p === "..."
                          ? "text-[#94a3b8] cursor-default"
                          : "text-[#475569] hover:bg-[#f8fafc] border border-[#e2e8f0]"
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasNext}
              className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm
                font-medium text-[#475569] hover:bg-[#f8fafc]
                disabled:opacity-40 disabled:cursor-not-allowed
                flex items-center gap-1.5 transition-colors"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Reusable filter dropdown ───────────────────────────────────────────────
// Extracted to keep the filter bar JSX readable.
function FilterDropdown({ value, onChange, active, children }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-8 pl-3 pr-7 rounded-lg border text-xs outline-none
          bg-white cursor-pointer appearance-none transition-all
          ${
            active
              ? "border-[#16a34a] text-[#16a34a] bg-[#f0fdf4] font-medium"
              : "border-[#e2e8f0] text-[#475569] hover:border-[#cbd5e1]"
          }`}
      >
        {children}
      </select>
      <ChevronDown
        size={11}
        className={`absolute right-2 top-1/2 -translate-y-1/2
          pointer-events-none
          ${active ? "text-[#16a34a]" : "text-[#94a3b8]"}`}
      />
    </div>
  );
}
