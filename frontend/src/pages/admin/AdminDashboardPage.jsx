import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { fetchDashboardStats } from "../../services/adminService.js";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "../../constants/issue.js";
import { timeAgo } from "../../utils/timeAgo.js";

const StatCard = ({ label, value, icon: Icon, bgClass, textClass, borderClass, sub }) => (
  <div className="bg-white rounded-2xl border border-[#e2e8f0] hover:border-slate-300 hover:-translate-y-1 hover:shadow-md transition-all duration-300 p-6 flex flex-col justify-between h-36">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">{label}</p>
        <p className="text-3xl font-extrabold text-[#0f172a] tracking-tight mt-2.5">
          {value ?? "—"}
        </p>
      </div>
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${bgClass} ${textClass} ${borderClass}`}
      >
        <Icon size={18} />
      </div>
    </div>
    {sub && <p className="text-xs text-[#94a3b8] font-medium">{sub}</p>}
  </div>
);

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats()
      .then((res) => setStats(res.stats))
      .catch(() => setError("Failed to load dashboard stats"))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-[#f1f5f9] rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 bg-[#f1f5f9] rounded-2xl" />
          ))}
        </div>
        <div className="h-80 bg-[#f1f5f9] rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-4 shadow-xs">
        {error}
      </div>
    );
  }

  const sc = stats?.statusCounts ?? {};
  const pendingReview = (sc.open ?? 0) + (sc.verified ?? 0);

  const statCards = [
    {
      label: "Total Issues",
      value: stats?.totalIssues,
      icon: ClipboardList,
      bgClass: "bg-blue-50/50",
      textClass: "text-blue-600",
      borderClass: "border-blue-100",
      sub: "All time reports received",
    },
    {
      label: "Pending Review",
      value: pendingReview,
      icon: Clock,
      bgClass: "bg-amber-50/50",
      textClass: "text-amber-600",
      borderClass: "border-amber-100",
      sub: "Awaiting administrator action",
    },
    {
      label: "In Progress",
      value: sc["in-progress"] ?? 0,
      icon: TrendingUp,
      bgClass: "bg-indigo-50/50",
      textClass: "text-indigo-600",
      borderClass: "border-indigo-100",
      sub: "Currently being resolved",
    },
    {
      label: "Resolved",
      value: sc.resolved ?? 0,
      icon: CheckCircle2,
      bgClass: "bg-emerald-50/50",
      textClass: "text-emerald-600",
      borderClass: "border-emerald-100",
      sub: "Successfully completed",
    },
    {
      label: "Rejected",
      value: sc.rejected ?? 0,
      icon: AlertCircle,
      bgClass: "bg-rose-50/50",
      textClass: "text-rose-500",
      borderClass: "border-rose-100",
      sub: "Issues not actionable",
    },
    {
      label: "Total Citizens",
      value: stats?.totalUsers,
      icon: Users,
      bgClass: "bg-purple-50/50",
      textClass: "text-purple-600",
      borderClass: "border-purple-100",
      sub: "Registered user accounts",
    },
  ];

  const categoryTheme = {
    "Road Damage": { bg: "bg-slate-50", border: "border-slate-100", text: "text-slate-700" },
    "Garbage": { bg: "bg-lime-50/70", border: "border-lime-100", text: "text-lime-700" },
    "Water Issue": { bg: "bg-sky-50", border: "border-sky-100", text: "text-sky-700" },
    "Street Light": { bg: "bg-amber-50/50", border: "border-amber-100", text: "text-amber-700" },
    "Illegal Construction": { bg: "bg-orange-50/50", border: "border-orange-100", text: "text-orange-700" },
    "Public Space": { bg: "bg-emerald-50/50", border: "border-emerald-100", text: "text-emerald-700" },
    "Other": { bg: "bg-gray-50", border: "border-gray-100", text: "text-gray-600" },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm font-medium text-[#64748b] mt-1.5">
          Overview of civic reports and engagement across SmartNepal
        </p>
      </div>

      {/* Pending review banner */}
      {pendingReview > 0 && (
        <div
          className="flex items-center gap-3.5 bg-amber-50/60 border border-amber-200/80
          backdrop-blur-xs rounded-2xl px-5 py-4 shadow-xs"
        >
          <Clock size={18} className="text-amber-600 shrink-0 animate-pulse" />
          <p className="text-sm text-amber-800 font-medium">
            There are <span className="font-bold">{pendingReview} unresolved reports</span> waiting for administrator review.
          </p>
          <Link
            to="/admin/issues"
            className="ml-auto flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors bg-white px-3 py-1.5 rounded-lg border border-amber-200 shadow-xs"
          >
            Review now <ChevronRight size={12} />
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Split layout for reports and categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent reports feed */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#e2e8f0] bg-slate-50/30">
            <h2 className="text-sm font-bold text-[#0f172a] tracking-tight uppercase">
              Recent Reports
            </h2>
            <Link
              to="/admin/issues"
              className="text-xs text-[#16a34a] hover:text-[#15803d] font-bold"
            >
              View all
            </Link>
          </div>
          {stats?.recentIssues?.length > 0 ? (
            <div className="divide-y divide-[#f1f5f9]">
              {stats.recentIssues.map((issue) => {
                const st = STATUS_CONFIG[issue.status] || STATUS_CONFIG.open;
                const pr = PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.low;
                return (
                  <div
                    key={issue._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4.5 hover:bg-[#f8fafc] transition-all duration-200"
                  >
                    <div className="min-w-0 space-y-1">
                      <Link
                        to={`/issues/${issue._id}`}
                        target="_blank"
                        className="text-sm font-bold text-[#0f172a] hover:text-[#16a34a] transition-colors truncate block"
                      >
                        {issue.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#94a3b8] font-medium">
                        <span className="text-[#64748b] bg-slate-100 px-2 py-0.5 rounded">
                          {issue.category}
                        </span>
                        <span>·</span>
                        <span>{issue.author?.name ?? "Unknown"}</span>
                        <span>·</span>
                        <span>{timeAgo(issue.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border"
                        style={{ backgroundColor: pr.bg + "20", color: pr.color, borderColor: pr.bg + "80" }}
                      >
                        {pr.label}
                      </span>
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: st.bg, color: st.text }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: st.dot }}
                        />
                        {st.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-sm text-[#94a3b8]">
              No issues reported yet.
            </div>
          )}
        </div>

        {/* Categories breakdown */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4.5 border-b border-[#e2e8f0] bg-slate-50/30">
              <h2 className="text-sm font-bold text-[#0f172a] tracking-tight uppercase">
                Reports by Category
              </h2>
            </div>
            {stats?.categoryCounts && Object.keys(stats.categoryCounts).length > 0 ? (
              <div className="p-6 space-y-3">
                {Object.entries(stats.categoryCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, count]) => {
                    const theme = categoryTheme[category] || categoryTheme["Other"];
                    return (
                      <div
                        key={category}
                        className={`flex items-center justify-between p-3.5 rounded-xl border ${theme.bg} ${theme.border}`}
                      >
                        <span className={`text-xs font-bold ${theme.text}`}>
                          {category}
                        </span>
                        <span className="text-base font-extrabold text-[#0f172a]">
                          {count}
                        </span>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-[#94a3b8]">
                No category breakdown available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
