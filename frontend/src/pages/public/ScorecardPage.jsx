import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  BarChart2,
  ArrowLeft,
  Info,
} from "lucide-react";
import { fetchScorecard } from "../../services/publicService.js";
import { CATEGORY_ICONS, CATEGORY_CONFIG } from "../../constants/issue.js";
import { STATUS_CONFIG } from "../../constants/issue.js";
import { AlertCircle } from "lucide-react";

const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
    <div className="flex items-start justify-between mb-3">
      <p className="text-sm text-[#64748b]">{label}</p>
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}
      >
        <Icon size={17} className="text-white" />
      </div>
    </div>
    <p className="text-3xl font-bold text-[#0f172a] tracking-tight">
      {value ?? "—"}
    </p>
    {sub && <p className="text-xs text-[#94a3b8] mt-1">{sub}</p>}
  </div>
);

export default function ScorecardPage() {
  const { province, district } = useParams();
  const isValidParam = province && province !== "null" && province !== "undefined";

  const [prevParams, setPrevParams] = useState({ province, district });
  const [scorecard, setScorecard] = useState(null);
  const [isLoading, setIsLoading] = useState(isValidParam);
  const [error, setError] = useState(isValidParam ? null : "Scorecard not found.");

  if (province !== prevParams.province || district !== prevParams.district) {
    setPrevParams({ province, district });
    setIsLoading(isValidParam);
    setError(isValidParam ? null : "Scorecard not found.");
    if (!isValidParam) {
      setScorecard(null);
    }
  }

  useEffect(() => {
    if (!isValidParam) return;

    let active = true;
    fetchScorecard(province, district)
      .then((res) => {
        if (active) {
          setScorecard(res.scorecard);
        }
      })
      .catch(() => {
        if (active) {
          setError("Could not load this scorecard.");
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [province, district, isValidParam]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <p className="text-sm text-[#94a3b8]">Loading scorecard…</p>
      </div>
    );
  }

  if (error || !scorecard) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center px-4 text-center">
        <AlertCircle size={32} className="text-[#e2e8f0] mb-4" />
        <p className="text-sm text-[#94a3b8]">
          {error || "Scorecard not found."}
        </p>
      </div>
    );
  }

  const hasDistrict =
    scorecard.district &&
    scorecard.district !== "null" &&
    scorecard.district !== "undefined" &&
    scorecard.district !== "";

  const hasProvince =
    scorecard.province &&
    scorecard.province !== "null" &&
    scorecard.province !== "undefined" &&
    scorecard.province !== "";

  const locationLabel =
    hasDistrict && hasProvince
      ? `${scorecard.district}, ${scorecard.province}`
      : hasProvince
        ? scorecard.province
        : "Unknown Location";

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="bg-white border-b border-[#e2e8f0]">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <Link
            to="/scorecard"
            className="inline-flex items-center gap-1.5 text-xs
            text-[#94a3b8] hover:text-[#475569] mb-5 transition-colors"
          >
            <ArrowLeft size={13} /> All municipalities
          </Link>
          <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight">
            {locationLabel}
          </h1>
          <p className="text-[#64748b] mt-1">
            Live civic issue performance data from NepalSewa
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {!scorecard.hasEnoughData && (
          <div
            className="flex items-start gap-3 bg-amber-50 border-l-4 border-amber-400
            rounded-xl px-5 py-4 mb-6"
          >
            <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              This municipality has {scorecard.totalIssues} report
              {scorecard.totalIssues !== 1 ? "s" : ""} on record — below the{" "}
              {scorecard.minimumSampleSize} needed for a reliable performance
              summary. Figures below are shown for reference only.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Reports"
            value={scorecard.totalIssues}
            icon={BarChart2}
            color="bg-blue-500"
            sub="All time"
          />
          <StatCard
            label="Resolution Rate"
            value={`${scorecard.resolutionRate}%`}
            icon={CheckCircle2}
            color="bg-[#16a34a]"
            sub={`${scorecard.resolvedCount} resolved`}
          />
          <StatCard
            label="Avg Resolution Time"
            value={
              scorecard.avgResolutionHours != null
                ? `${scorecard.avgResolutionHours}h`
                : "—"
            }
            icon={Clock}
            color="bg-amber-500"
            sub={
              scorecard.avgResolutionHours != null
                ? "For resolved issues"
                : "No resolved issues yet"
            }
          />
          <StatCard
            label="Currently Overdue"
            value={scorecard.overdueCount}
            icon={scorecard.overdueCount > 0 ? AlertTriangle : CheckCircle2}
            color={scorecard.overdueCount > 0 ? "bg-red-500" : "bg-[#16a34a]"}
            sub={
              scorecard.overdueCount > 0
                ? "Past SLA deadline"
                : "All issues on track"
            }
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
            <h2 className="text-sm font-semibold text-[#0f172a] mb-4">
              Issues by Status
            </h2>
            {scorecard.issuesByStatus.length === 0 ? (
              <p className="text-xs text-[#94a3b8] py-6 text-center">
                No issues yet
              </p>
            ) : (
              <div className="space-y-3">
                {scorecard.issuesByStatus.map(({ status, count }) => {
                  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
                  const pct =
                    scorecard.totalIssues > 0
                      ? (count / scorecard.totalIssues) * 100
                      : 0;
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-[#0f172a]">
                          {cfg.label}
                        </span>
                        <span className="text-[#94a3b8]">{count}</span>
                      </div>
                      <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: cfg.dot }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
            <h2 className="text-sm font-semibold text-[#0f172a] mb-4">
              Issues by Category
            </h2>
            {scorecard.issuesByCategory.length === 0 ? (
              <p className="text-xs text-[#94a3b8] py-6 text-center">
                No issues yet
              </p>
            ) : (
              <div className="space-y-3">
                {scorecard.issuesByCategory.map(({ category, count }) => {
                  const Icon = CATEGORY_ICONS[category] || AlertCircle;
                  const cfg =
                    CATEGORY_CONFIG[category] || CATEGORY_CONFIG["Other"];
                  return (
                    <div key={category} className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: cfg.bg }}
                      >
                        <Icon size={14} style={{ color: cfg.color }} />
                      </div>
                      <p className="text-sm text-[#0f172a] flex-1">
                        {category}
                      </p>
                      <p className="text-sm font-semibold text-[#0f172a]">
                        {count}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-[#94a3b8] text-center mt-10">
          Data sourced live from NepalSewa civic issue reports. Updated
          continuously.
        </p>
      </div>
    </div>
  );
}
