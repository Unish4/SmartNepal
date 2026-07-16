import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { fetchScorecardDirectory } from "../../services/publicService.js";

export default function ScorecardDirectoryPage() {
  const [directory, setDirectory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchScorecardDirectory()
      .then((res) => setDirectory(res.directory))
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, []);

  const grouped = directory.reduce((acc, item) => {
    if (!acc[item.province]) acc[item.province] = [];
    acc[item.province].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="bg-white border-b border-[#e2e8f0]">
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight mb-2">
            Municipality Scorecards
          </h1>
          <p className="text-[#64748b] max-w-lg mx-auto">
            Real, live civic issue data for every municipality on NepalSewa
            resolution rates, response times, and category breakdowns, updated
            continuously.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 bg-white rounded-xl border border-[#e2e8f0] animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <p className="text-center text-[#94a3b8] py-16">
            Failed to load municipality data.
          </p>
        ) : Object.keys(grouped).length === 0 ? (
          <p className="text-center text-[#94a3b8] py-16">
            No municipality data available yet.
          </p>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([province, districts]) => (
              <div
                key={province}
                className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden"
              >
                <div className="px-5 py-3.5 border-b border-[#f1f5f9] bg-[#f8fafc]">
                  <h2 className="text-sm font-semibold text-[#0f172a]">
                    {province}
                  </h2>
                </div>
                <div className="divide-y divide-[#f8fafc]">
                  {districts.map((d) => (
                    <Link
                      key={d.district}
                      to={`/scorecard/${encodeURIComponent(province)}/${encodeURIComponent(d.district)}`}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-[#f8fafc] transition-colors group"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#0f172a]">
                          {d.district}
                        </p>
                        <p className="text-xs text-[#94a3b8] mt-0.5">
                          {d.count} report{d.count !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-[#cbd5e1] group-hover:text-[#16a34a] transition-colors"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
