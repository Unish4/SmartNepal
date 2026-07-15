import { useEffect, useState } from "react";
import { ScrollText, ChevronDown } from "lucide-react";
import { fetchAuditLog } from "../../services/adminService.js";
import { timeAgo } from "../../utils/timeAgo.js";

const ACTION_LABELS = {
  issue_status_change: "Status changed",
  issue_assignment: "Issue assigned",
  issue_deletion: "Issue deleted",
  admin_created: "Admin created",
  admin_jurisdiction_update: "Jurisdiction updated",
  field_worker_created: "Field worker created",
};

const ACTION_COLORS = {
  issue_status_change: { bg: "#f5f3ff", text: "#6d28d9" },
  issue_assignment: { bg: "#fffbeb", text: "#b45309" },
  issue_deletion: { bg: "#fef2f2", text: "#b91c1c" },
  admin_created: { bg: "#faf5ff", text: "#7c3aed" },
  admin_jurisdiction_update: { bg: "#faf5ff", text: "#7c3aed" },
  field_worker_created: { bg: "#fff7ed", text: "#ea580c" },
};

const describeDetails = (log) => {
  const d = log.details || {};
  switch (log.action) {
    case "issue_status_change":
      return `${d.from} → ${d.to}`;
    case "issue_assignment":
      return `Assigned to ${d.assignedToName || "a field worker"}`;
    case "issue_deletion":
      return `"${d.title}"`;
    case "admin_created":
      return `${d.name} (${d.email})`;
    case "admin_jurisdiction_update": {
      const from = d.previousJurisdiction?.province
        ? `${d.previousJurisdiction.district ? d.previousJurisdiction.district + ", " : ""}${d.previousJurisdiction.province}`
        : "unassigned";
      const to = d.newJurisdiction?.province
        ? `${d.newJurisdiction.district ? d.newJurisdiction.district + ", " : ""}${d.newJurisdiction.province}`
        : "unassigned";
      return `${from} → ${to}`;
    }
    case "field_worker_created":
      return `${d.name} — ${d.department}`;
    default:
      return "";
  }
};

const AdminAuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    const params = { page, limit: 20 };
    if (actionFilter) params.action = actionFilter;
    fetchAuditLog(params)
      .then((res) => {
        if (isMounted) {
          setLogs(res.logs);
          setPagination(res.pagination);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [actionFilter, page]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
          Audit Log
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          Every admin action recorded within your jurisdiction
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-4 mb-5">
        <div className="relative inline-block">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 pl-3 pr-8 text-sm border border-[#e2e8f0] rounded-lg bg-white
              outline-none cursor-pointer appearance-none"
          >
            <option value="">All actions</option>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-12 bg-[#f1f5f9] rounded animate-pulse"
              />
            ))}
          </div>
        ) : logs.length > 0 ? (
          <div className="divide-y divide-[#f8fafc]">
            {logs.map((log) => {
              const colors = ACTION_COLORS[log.action] || {
                bg: "#f1f5f9",
                text: "#64748b",
              };
              return (
                <div
                  key={log._id}
                  className="flex items-start gap-3 px-5 py-3.5"
                >
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {ACTION_LABELS[log.action] || log.action}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#0f172a]">
                      <span className="font-semibold">
                        {log.actor?.name || "Unknown"}
                      </span>{" "}
                      <span className="text-[#94a3b8]">
                        — {describeDetails(log)}
                      </span>
                    </p>
                    {log.jurisdiction?.province && (
                      <p className="text-xs text-[#94a3b8] mt-0.5">
                        {log.jurisdiction.district
                          ? `${log.jurisdiction.district}, `
                          : ""}
                        {log.jurisdiction.province}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-[#94a3b8] shrink-0 whitespace-nowrap">
                    {timeAgo(log.createdAt)}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center">
            <ScrollText size={28} className="text-[#e2e8f0] mx-auto mb-2" />
            <p className="text-sm text-[#94a3b8]">No audit entries yet</p>
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3.5 border-t border-[#e2e8f0]">
            <p className="text-xs text-[#94a3b8]">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={!pagination.hasPrev}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-xs font-medium border border-[#e2e8f0] rounded-lg
                  hover:bg-[#f8fafc] text-[#475569] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              <button
                disabled={!pagination.hasNext}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs font-medium border border-[#e2e8f0] rounded-lg
                  hover:bg-[#f8fafc] text-[#475569] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditLogPage;
