import { useEffect, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { Link } from "react-router-dom";
import { Flame, ChevronDown, MapPin, List } from "lucide-react";
import { fetchHeatmapData } from "../../services/issueService.js";
import { CATEGORIES } from "../../constants/issue.js";
import { useIssueLabels } from "../../hooks/useIssueLabels.js";
import HeatmapLayer from "../../components/map/HeatmapLayer.jsx";

const NEPAL_CENTER = [28.3949, 84.124];
const DEFAULT_ZOOM = 7;

const STATUS_OPTIONS = ["", "open", "verified", "in-progress", "resolved"];
const DAY_OPTIONS = [
  { label: "All time", value: "" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
];

export default function MapViewPage() {
  const { getCategoryLabel, getStatusLabel } = useIssueLabels();

  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [days, setDays] = useState("");
  const [points, setPoints] = useState([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        setIsLoading(true);
        setError("");
      }
    });

    const params = {};
    if (category) params.category = category;
    if (status) params.status = status;
    if (days) params.days = days;

    fetchHeatmapData(params)
      .then((res) => {
        if (active) {
          setPoints(res.points);
          setCount(res.count);
        }
      })
      .catch((err) => {
        if (active) {
          setPoints([]);
          setCount(0);
          setError(err?.response?.data?.message || "Unable to load heatmap data.");
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
  }, [category, status, days]);
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Filter bar — same visual language as IssuesPage's filter bar */}
      <div className="bg-white border-b border-[#e2e8f0] sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-[#ea580c]" />
            <h1 className="text-lg font-bold text-[#0f172a]">
              Issue Density Map
            </h1>
          </div>

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <FilterDropdown
              value={category}
              onChange={setCategory}
              active={!!category}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {getCategoryLabel(c)}
                </option>
              ))}
            </FilterDropdown>

            <FilterDropdown
              value={status}
              onChange={setStatus}
              active={!!status}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s ? getStatusLabel(s) : "All Statuses"}
                </option>
              ))}
            </FilterDropdown>

            <FilterDropdown value={days} onChange={setDays} active={!!days}>
              {DAY_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </FilterDropdown>

            <Link
              to="/issues"
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0]
                text-xs font-semibold text-[#475569] hover:bg-[#f8fafc] transition-colors"
            >
              <List size={12} /> List view
            </Link>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={NEPAL_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: "calc(100vh - 114px)", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {!isLoading && <HeatmapLayer points={points} />}
        </MapContainer>

        {/* Count badge, floating over the map */}
        <div
          className="absolute bottom-5 left-5 bg-white rounded-xl border border-[#e2e8f0]
          shadow-lg px-4 py-2.5 flex items-center gap-2 z-1000"
        >
          <MapPin size={13} className="text-[#16a34a]" />
          <span className="text-xs font-semibold text-[#0f172a]">
            {isLoading
              ? "Loading…"
              : `${count} report${count !== 1 ? "s" : ""} shown`}
          </span>
        </div>

        {!isLoading && error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-1000">
            <div className="bg-white rounded-xl border border-[#fecaca] shadow-lg px-6 py-4 text-center max-w-sm mx-4">
              <p className="text-sm font-medium text-[#b91c1c]">{error}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-1000">
            <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-lg px-6 py-4 text-center">
              <p className="text-sm text-[#94a3b8]">
                No reports match these filters
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterDropdown({ value, onChange, active, children }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-8 pl-3 pr-7 rounded-lg border text-xs outline-none bg-white
          cursor-pointer appearance-none transition-all
          ${active ? "border-[#16a34a] text-[#16a34a] bg-[#f0fdf4] font-medium" : "border-[#e2e8f0] text-[#475569] hover:border-[#cbd5e1]"}`}
      >
        {children}
      </select>
      <ChevronDown
        size={11}
        className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${active ? "text-[#16a34a]" : "text-[#94a3b8]"}`}
      />
    </div>
  );
}
