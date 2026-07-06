import { Search, X, SlidersHorizontal } from "lucide-react";
import { CATEGORIES } from "../../constants/issue.js";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "verified", label: "Verified" },
  { value: "in-progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "most-upvoted", label: "Most upvoted" },
];

const FilterBar = ({
  search,
  filters,
  onSearchChange,
  onFilterChange,
  onClearAll,
  hasActiveFilters,
  totalResults,
}) => {
  return (
    <div
      className="sticky top-16 z-30 bg-white border-b border-gray-200
      py-3 mb-6 -mx-4 px-4"
    >
      {/* ── Row 1: Search  */}
      <div className="relative mb-3">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400
            pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search issues by title or description…"
          className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-200
            rounded-lg outline-none focus:border-green-500 focus:bg-green-50/20
            transition-all"
        />
        {/* Clear search — only shown when there's text in the input */}
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
              hover:text-gray-700 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div
        className="flex items-center gap-2 overflow-x-auto pb-1 mb-3"
        style={{ scrollbarWidth: "none" }}
      >
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onFilterChange("status", option.value)}
            className={`shrink-0 px-3 py-1.5 text-xs font-medium 
              border transition-all whitespace-nowrap
              ${
                filters.status === option.value
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-600"
              }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* ── Row 3: Dropdowns + active count + Clear all  */}
      <div className="flex items-center gap-2 flex-wrap">
        <SlidersHorizontal size={14} className="text-gray-400 shrink-0" />

        {/* Category */}
        <select
          value={filters.category}
          onChange={(e) => onFilterChange("category", e.target.value)}
          className={`px-3 py-2 text-xs rounded-lg border bg-white outline-none
            transition-colors cursor-pointer
            ${
              filters.category
                ? "border-green-400 text-green-700"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Priority */}
        <select
          value={filters.priority}
          onChange={(e) => onFilterChange("priority", e.target.value)}
          className={`px-3 py-2 text-xs rounded-lg border bg-white outline-none
            transition-colors cursor-pointer
            ${
              filters.priority
                ? "border-green-400 text-green-700"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        {/* Sort */}
        <select
          value={filters.sort}
          onChange={(e) => onFilterChange("sort", e.target.value)}
          className={`px-3 py-2 text-xs rounded-lg border bg-white outline-none
            transition-colors cursor-pointer
            ${
              filters.sort !== "newest"
                ? "border-green-400 text-green-700"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Active results count — shown when a filter/search is active */}
        {hasActiveFilters && totalResults !== undefined && (
          <span className="text-xs text-gray-400 ml-1">
            {totalResults} result{totalResults !== 1 ? "s" : ""}
          </span>
        )}

        {/* Clear all — only visible when at least one filter is active */}
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-red-500
              hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50
              transition-colors ml-auto"
          >
            <X size={12} />
            Clear all
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
