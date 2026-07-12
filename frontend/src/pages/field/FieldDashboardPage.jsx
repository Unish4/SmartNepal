import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, ClipboardList, Clock, CheckCircle2, Loader2 } from "lucide-react";
import {
  fetchMyAssignments,
  fetchFieldStats,
} from "../../services/fieldWorkerService.js";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "../../constants/issue.js";
import { timeAgo } from "../../utils/timeAgo.js";

const FILTER_TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "verified" },
  { label: "In Progress", value: "in-progress" },
  { label: "Resolved", value: "resolved" },
];

const StatPill = ({ label, value, Icon, color }) => (
  <div className="flex-1 bg-white rounded-xl border border-[#e2e8f0] p-3 text-center">
    <Icon size={16} className="mx-auto mb-1" style={{ color }} />
    <p className="text-lg font-bold text-[#0f172a]">{value}</p>
    <p className="text-[10px] text-[#94a3b8] font-medium">{label}</p>
  </div>
);

const AssignmentCard = ({ issue }) => {
  const st = STATUS_CONFIG[issue.status] || STATUS_CONFIG.open;
  const pr = PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.low;

  return (
    <Link
      to={`/field/assignments/${issue._id}`}
      className="block bg-white rounded-xl border border-[#e2e8f0] p-4
        hover:border-[#16a34a] hover:shadow-sm active:scale-[0.98] transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full
          text-[10px] font-semibold"
          style={{ backgroundColor: st.bg, color: st.text }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: st.dot }}
          />
          {st.label}
        </span>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded
          text-[10px] font-semibold shrink-0"
          style={{ backgroundColor: pr.bg, color: pr.color }}
        >
          {pr.label}
        </span>
      </div>

      <h3 className="text-sm font-semibold text-[#0f172a] leading-snug line-clamp-2 mb-2">
        {issue.title}
      </h3>

      <div className="flex items-center justify-between text-xs text-[#94a3b8]">
        <span className="flex items-center gap-1 truncate">
          <MapPin size={11} className="shrink-0" />
          <span className="truncate">
            {issue.location?.address || "No address"}
          </span>
        </span>
        <span className="shrink-0 ml-2">{timeAgo(issue.createdAt)}</span>
      </div>
    </Link>
  );
};

export default function FieldDashboardPage() {
  const [assignments, setAssignments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchFieldStats()
      .then((res) => setStats(res.stats))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (assignments.length === 0 && isLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    const params = { page, limit: 10 };
    if (activeTab) params.status = activeTab;

    fetchMyAssignments(params)
      .then((res) => {
        setAssignments(res.assignments);
        setPagination(res.pagination);
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
        setIsRefreshing(false);
      });
  }, [activeTab, page]);

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[#0f172a]">My Assignments</h1>
        <p className="text-xs text-[#64748b] mt-0.5">
          Issues dispatched to you by the municipality
        </p>
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="flex gap-2 mb-4">
          <StatPill
            label="Pending"
            value={stats.pending}
            Icon={ClipboardList}
            color="#f59e0b"
          />
          <StatPill
            label="In Progress"
            value={stats.inProgress}
            Icon={Clock}
            color="#0284c7"
          />
          <StatPill
            label="Resolved"
            value={stats.resolved}
            Icon={CheckCircle2}
            color="#16a34a"
          />
        </div>
      )}

      {/* Filter tabs — horizontal scroll on very small screens */}
      <div
        className="flex gap-2 mb-4 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {FILTER_TABS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => {
              setActiveTab(value);
              setPage(1);
            }}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold
              border transition-all whitespace-nowrap
              ${
                activeTab === value
                  ? "bg-[#16a34a] text-white border-[#16a34a]"
                  : "bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#cbd5e1]"
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Assignment list */}
      <div className="relative min-h-40">
        {isRefreshing && (
          <div className="absolute inset-0 bg-[#f8fafc]/55 backdrop-blur-[0.5px] flex items-center justify-center z-10 rounded-xl">
            <Loader2 className="animate-spin text-[#16a34a]" size={20} />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-[#e2e8f0]
                p-4 animate-pulse space-y-2"
              >
                <div className="h-4 w-16 bg-slate-100 rounded-full" />
                <div className="h-4 w-full bg-slate-100 rounded" />
                <div className="h-3 w-2/3 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : assignments.length > 0 ? (
          <div className="space-y-3">
            {assignments.map((issue) => (
              <AssignmentCard key={issue._id} issue={issue} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-16">
            <div
              className="w-14 h-14 rounded-full bg-[#f0fdf4] flex items-center
              justify-center mb-3"
            >
              <ClipboardList size={22} className="text-[#16a34a]" />
            </div>
            <p className="text-sm font-semibold text-[#0f172a] mb-1">
              No assignments here
            </p>
            <p className="text-xs text-[#94a3b8] max-w-55">
              {activeTab
                ? "Nothing in this category right now."
                : "You'll see issues here once an admin assigns them to you."}
            </p>
          </div>
        )}
      </div>

      {/* Pagination — large tap targets for mobile */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            disabled={!pagination.hasPrev}
            onClick={() => setPage((p) => p - 1)}
            className="h-10 px-4 rounded-lg border border-[#e2e8f0] text-sm
              font-medium text-[#475569] hover:bg-[#f8fafc] disabled:opacity-40
              disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            ← Prev
          </button>
          <span className="text-xs text-[#94a3b8]">
            {pagination.page} / {pagination.pages}
          </span>
          <button
            disabled={!pagination.hasNext}
            onClick={() => setPage((p) => p + 1)}
            className="h-10 px-4 rounded-lg border border-[#e2e8f0] text-sm
              font-medium text-[#475569] hover:bg-[#f8fafc] disabled:opacity-40
              disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
