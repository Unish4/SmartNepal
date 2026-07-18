import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  Layers,
  BarChart2,
} from "lucide-react";
import { fetchAnalytics } from "../../services/analyticsService.js";
import { STATUS_CONFIG } from "../../constants/issue.js";

// Chart colours matching Figma's chart tokens
const STATUS_COLORS = {
  open: "#3b82f6",
  verified: "#6366f1",
  "in-progress": "#f59e0b",
  resolved: "#10b981",
  rejected: "#f43f5e",
};
const PRIORITY_COLORS = {
  low: "#94a3b8",
  medium: "#f59e0b",
  high: "#ea580c",
  critical: "#ef4444",
};
const RADIAN = Math.PI / 180;

const fillDateGaps = (data, days) => {
  const result = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    const ex = data.find((x) => x.date === ds);
    result.push({
      date: ds,
      count: ex?.count ?? 0,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
  }
  return result;
};

const ChartCard = ({ title, children, className = "" }) => (
  <div
    className={`bg-white rounded-2xl border border-[#e2e8f0] shadow-xs overflow-hidden ${className}`}
  >
    <div className="px-6 py-4.5 border-b border-[#e2e8f0] bg-slate-50/20">
      <h2 className="text-sm font-bold text-[#0f172a] tracking-tight uppercase">
        {title}
      </h2>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const ChartEmpty = ({ msg }) => (
  <div className="flex flex-col items-center justify-center h-52">
    <BarChart2 size={32} className="text-[#cbd5e1] mb-2.5 animate-pulse" />
    <p className="text-xs font-semibold text-[#94a3b8]">{msg}</p>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/80 backdrop-blur-md border border-[#e2e8f0] rounded-xl shadow-lg p-3 text-xs min-w-36">
      {label && (
        <p className="text-[#94a3b8] mb-1.5 font-bold uppercase tracking-wider text-[9px]">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((e, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="text-[#475569] font-medium">{e.name}:</span>
            <span
              className="font-extrabold"
              style={{ color: e.color || e.fill }}
            >
              {e.value}
              {e.name === "Avg hours" ? "h" : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const renderPieLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={10}
      fontWeight={700}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const KpiCard = ({
  label,
  value,
  sub,
  icon: Icon,
  bgClass,
  textClass,
  borderClass,
}) => (
  <div className="bg-white rounded-2xl border border-[#e2e8f0] hover:border-slate-300 hover:-translate-y-1 hover:shadow-md transition-all duration-300 p-6 flex flex-col justify-between h-36">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
          {label}
        </p>
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

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [days, setDays] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleDaysChange = (newDays) => {
    setDays(newDays);
    setIsLoading(true);
    setError(null);
  };

  useEffect(() => {
    let isMounted = true;
    fetchAnalytics(days)
      .then((res) => {
        if (isMounted) setAnalytics(res.analytics);
      })
      .catch(() => {
        if (isMounted) setError("Failed to load analytics. Please try again.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [days]);
  const filledTimeData = analytics
    ? fillDateGaps(analytics.issuesOverTime, days)
    : [];
  const timeAxisInterval = Math.floor(filledTimeData.length / 6);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-44 bg-[#f1f5f9] rounded-lg" />
          <div className="h-9 w-48 bg-[#f1f5f9] rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 bg-[#f1f5f9] rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-[#f1f5f9] rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 h-80 bg-[#f1f5f9] rounded-2xl" />
          <div className="lg:col-span-2 h-80 bg-[#f1f5f9] rounded-2xl" />
        </div>
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

  if (!analytics) return null;

  const top = analytics.issuesByCategory[0]?.category ?? "—";

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">
            Analytics
          </h1>
          <p className="text-sm font-medium text-[#64748b] mt-1.5">
            Civic issue trends and performance metrics across the platform
          </p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => handleDaysChange(d)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer
                ${days === d ? "bg-white text-[#0f172a] shadow-xs" : "text-[#64748b] hover:text-[#0f172a]"}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          label="Total Issues"
          value={analytics.totalIssues}
          sub="All-time reports"
          icon={Layers}
          bgClass="bg-blue-50/50"
          textClass="text-blue-600"
          borderClass="border-blue-100"
        />
        <KpiCard
          label="Resolution Rate"
          value={`${analytics.resolutionRate}%`}
          sub={`${analytics.resolvedCount} issues resolved`}
          icon={CheckCircle2}
          bgClass="bg-emerald-50/50"
          textClass="text-emerald-600"
          borderClass="border-emerald-100"
        />
        <KpiCard
          label="Avg Resolution"
          value={
            analytics.avgResolutionHours != null
              ? `${analytics.avgResolutionHours}h`
              : "—"
          }
          sub={
            analytics.avgResolutionHours != null
              ? "Average closure duration"
              : "No resolved issues yet"
          }
          icon={Clock}
          bgClass="bg-amber-50/50"
          textClass="text-amber-600"
          borderClass="border-amber-100"
        />
        <KpiCard
          label="Top Category"
          value={top}
          sub={`${analytics.issuesByCategory[0]?.count ?? 0} total reports`}
          icon={TrendingUp}
          bgClass="bg-purple-50/50"
          textClass="text-purple-600"
          borderClass="border-purple-100"
        />
      </div>

      {/* Issues over time */}
      <ChartCard title={`Issues reported — last ${days} days`}>
        {filledTimeData.every((d) => d.count === 0) ? (
          <ChartEmpty msg="No issues reported in this period" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={filledTimeData}
              margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                interval={timeAxisInterval}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                name="Issues"
                stroke="#16a34a"
                strokeWidth={2.5}
                fill="url(#areaGradient)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "#16a34a",
                  strokeWidth: 2,
                  stroke: "#fff",
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Category + Status row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <ChartCard title="Issues by Category" className="lg:col-span-3">
          {analytics.issuesByCategory.length === 0 ? (
            <ChartEmpty msg="No issues reported yet" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={analytics.issuesByCategory}
                layout="vertical"
                margin={{ top: 0, right: 24, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="barCategoryGradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="#f1f5f9"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fontSize: 10, fill: "#374151", fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  width={110}
                />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Bar
                  dataKey="count"
                  name="Issues"
                  fill="url(#barCategoryGradient)"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={16}
                  activeBar={false}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Issues by Status" className="lg:col-span-2">
          {analytics.issuesByStatus.length === 0 ? (
            <ChartEmpty msg="No issues to display" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={analytics.issuesByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="45%"
                  outerRadius={80}
                  innerRadius={55}
                  labelLine={false}
                  label={renderPieLabel}
                >
                  {analytics.issuesByStatus.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status] ?? "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => STATUS_CONFIG[v]?.label ?? v}
                  wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Priority + Resolution time row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Issues by Priority">
          {analytics.issuesByPriority.length === 0 ? (
            <ChartEmpty msg="No issues reported yet" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={analytics.issuesByPriority}
                margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="priority"
                  tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Bar
                  dataKey="count"
                  name="Issues"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                  activeBar={false}
                >
                  {analytics.issuesByPriority.map((e) => (
                    <Cell
                      key={e.priority}
                      fill={PRIORITY_COLORS[e.priority] ?? "#94a3b8"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Avg Resolution Time by Category">
          {analytics.resolutionTimeByCategory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 gap-2 text-center">
              <Clock size={32} className="text-[#cbd5e1] animate-pulse" />
              <p className="text-xs font-semibold text-[#94a3b8] max-w-xs leading-relaxed">
                No resolved issues in this period. Resolve reports to populate
                resolution metrics.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={analytics.resolutionTimeByCategory}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="barResolutionGradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="#f1f5f9"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  unit="h"
                  tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fontSize: 10, fill: "#374151", fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  width={110}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  formatter={(v) => [`${v}h`, "Avg time"]}
                  cursor={false}
                />
                <Bar
                  dataKey="avgHours"
                  name="Avg hours"
                  fill="url(#barResolutionGradient)"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={16}
                  activeBar={false}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
      {/* Phase 41 — Resolution cost by category */}
      <ChartCard
        title={`Resolution Cost by Category${analytics.totalCost ? ` — NPR ${analytics.totalCost.toLocaleString()} total` : ""}`}
      >
        {analytics.costByCategory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <BarChart2 size={28} className="text-[#e2e8f0]" />
            <p className="text-xs text-[#94a3b8] text-center max-w-55">
              No resolution cost has been recorded yet. Field workers and admins
              can log a cost when marking an issue resolved.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={analytics.costByCategory}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f3f4f6"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="category"
                tick={{ fontSize: 11, fill: "#374151" }}
                tickLine={false}
                axisLine={false}
                width={105}
              />
              <Tooltip
                content={<CustomTooltip />}
                formatter={(value) => [
                  `NPR ${value.toLocaleString()}`,
                  "Total cost",
                ]}
                cursor={false}
              />
              <Bar
                dataKey="totalCost"
                name="Total Cost (NPR)"
                fill="#0d9488"
                radius={[0, 4, 4, 0]}
                maxBarSize={22}
                activeBar={false}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
