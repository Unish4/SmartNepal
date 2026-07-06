import { Link } from "react-router-dom";
import {
  MapPin,
  AlertTriangle,
  Trash2,
  Droplets,
  Lightbulb,
  Building2,
  Trees,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import useAuthStore from "../store/useAuthStore";



const CATEGORIES = [
  {
    Icon: AlertTriangle,
    label: "Road Damage",
    desc: "Potholes, sinkholes, surface damage",
    color: "#64748b",
    bg: "#f1f5f9",
  },
  {
    Icon: Trash2,
    label: "Garbage & Waste",
    desc: "Illegal dumping, overflowing bins",
    color: "#65a30d",
    bg: "#f7fee7",
  },
  {
    Icon: Droplets,
    label: "Water Issues",
    desc: "Burst pipes, drainage, flooding",
    color: "#0284c7",
    bg: "#f0f9ff",
  },
  {
    Icon: Lightbulb,
    label: "Street Lights",
    desc: "Broken or non-functional lighting",
    color: "#ca8a04",
    bg: "#fefce8",
  },
  {
    Icon: Building2,
    label: "Illegal Construction",
    desc: "Unauthorized structures, encroachments",
    color: "#ea580c",
    bg: "#fff7ed",
  },
  {
    Icon: Trees,
    label: "Parks & Public Spaces",
    desc: "Damaged parks, public facilities",
    color: "#16a34a",
    bg: "#f0fdf4",
  },
];

const HOW_IT_WORKS = [
  {
    n: "01",
    Icon: MapPin,
    title: "Take a photo & report",
    desc: "Photograph the issue and submit a report with a description in seconds.",
  },
  {
    n: "02",
    Icon: TrendingUp,
    title: "Add your location",
    desc: "Pin the exact location on the map so authorities find it immediately.",
  },
  {
    n: "03",
    Icon: CheckCircle,
    title: "Municipality gets notified",
    desc: "The relevant municipality receives, triages, and dispatches a crew.",
  },
];

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="bg-[#f8fafc]">
      {/* ── Hero  */}
      <section className="bg-white border-b border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left */}
            <div className="flex-1">
              <div
                className="inline-flex items-center gap-2 bg-[#f0fdf4] text-[#16a34a]
                text-xs font-semibold px-3 py-1.5 rounded-full border border-[#bbf7d0] mb-6"
              >
                <MapPin size={11} />
                Civic Issue Reporting for Nepal
              </div>

              <h1
                className="text-4xl md:text-5xl font-bold text-[#0f172a]
                tracking-tight leading-[1.1] mb-5"
              >
                Your voice shapes a<br />
                better <span className="text-[#16a34a]">Nepal.</span>
              </h1>

              <p className="text-[#475569] text-lg leading-relaxed mb-8 max-w-130">
                Report broken roads, garbage, water issues, and more in seconds.
                SmartNepal connects citizens directly to their municipalities.
              </p>

              <div className="flex flex-wrap gap-3 mb-6">
                <Link
                  to={isAuthenticated ? "/issues/new" : "/register"}
                  className="inline-flex items-center gap-2 h-12 px-7 rounded-xl
                    bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-[15px]
                    transition-colors shadow-sm"
                >
                  Report an Issue
                </Link>
                <Link
                  to="/issues"
                  className="inline-flex items-center gap-2 h-12 px-7 rounded-xl
                    border border-[#e2e8f0] text-[#475569] font-semibold text-[15px]
                    hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-all"
                >
                  View Issues Near You
                </Link>
              </div>

              <div className="flex items-center gap-5 text-xs text-[#94a3b8]">
                {[
                  "Free for citizens",
                  "All 7 Provinces",
                  "AI-powered triage",
                ].map((t, i) => (
                  <span key={t} className="flex items-center gap-1.5">
                    {i > 0 && <span className="text-[#e2e8f0]">·</span>}
                    <CheckCircle size={11} className="text-[#16a34a]" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — floating issue card preview */}
            <div className="shrink-0 w-full max-w-sm">
              <div
                className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xl
                overflow-hidden -rotate-1 hover:rotate-0 transition-transform duration-300"
              >
                <div className="relative h-40 bg-[#dce8d8] overflow-hidden">
                  <img
                    src="/WaterIssue.jpg"
                    alt="Sample issue"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/10 to-transparent" />
                  <span
                    className="absolute top-3 left-3 inline-flex items-center gap-1.5
                    px-2 py-0.5 rounded-full text-xs font-medium bg-[#eff6ff] text-[#1d4ed8]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                    Open
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-[#f1f5f9] text-[#64748b] text-[10px] font-medium px-2 py-0.5 rounded">
                      Road Damage
                    </span>
                    <span className="bg-[#fff7ed] text-[#ea580c] text-[10px] font-medium px-2 py-0.5 rounded">
                      High
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#0f172a] line-clamp-2 mb-1">
                    Large pothole causing accidents on Bagbazaar Road
                  </p>
                  <p className="text-xs text-[#64748b] mb-3 line-clamp-2">
                    A significant pothole near the temple intersection has been
                    growing for weeks.
                  </p>
                  <div className="flex items-center justify-between text-xs text-[#94a3b8] pt-2 border-t border-[#f1f5f9]">
                    <span className="flex items-center gap-1">
                      <MapPin size={10} />
                      Bagbazaar, Kathmandu
                    </span>
                    <span>2h ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

     

      {/* ── How it works  */}
      <section className="bg-white border-y border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-[#0f172a] text-center mb-2">
            How SmartNepal works
          </h2>
          <p className="text-[#94a3b8] text-center mb-10">
            Three simple steps to get your issue resolved.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(({ n, Icon, title, desc }, i) => (
              <div
                key={title}
                className="relative bg-[#f8fafc] rounded-2xl p-7 border border-[#e2e8f0]
                hover:border-[#16a34a]/30 hover:shadow-md transition-all"
              >
                <p
                  className="text-[80px] font-black text-[#16a34a]/20 leading-none
                  absolute top-3 right-5 select-none"
                >
                  {n}
                </p>
                <div
                  className="w-11 h-11 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0]
                  flex items-center justify-center mb-4"
                >
                  <Icon size={20} className="text-[#16a34a]" />
                </div>
                <h3 className="text-base font-semibold text-[#0f172a] mb-2">
                  {title}
                </h3>
                <p className="text-sm text-[#64748b] leading-relaxed">{desc}</p>
                {i < 2 && (
                  <div
                    className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2
                    w-6 h-6 rounded-full bg-white border border-[#e2e8f0] items-center
                    justify-center z-10 text-[#94a3b8]"
                  >
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category grid  */}
      <section className="bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-[#0f172a] text-center mb-2">
            What can you report?
          </h2>
          <p className="text-[#94a3b8] text-center mb-10">
            SmartNepal handles every kind of civic issue.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CATEGORIES.map(({ Icon, label, desc, color, bg }) => (
              <Link
                key={label}
                to={`/issues?category=${encodeURIComponent(label)}`}
                className="bg-white rounded-2xl p-5 border border-[#e2e8f0] flex
                  items-start gap-4 hover:shadow-md hover:border-[#cbd5e1]
                  hover:-translate-y-0.5 transition-all duration-200"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: bg }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#0f172a] mb-1">
                    {label}
                  </h3>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    {desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer  */}
      <footer className="bg-[#0f172a] text-white w-full">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#16a34a] flex items-center justify-center">
                  <MapPin size={14} className="text-white" />
                </div>
                <span className="font-bold text-white text-[15px]">
                  SmartNepal
                </span>
              </div>
              <p className="text-[#64748b] text-sm max-w-60 leading-relaxed">
                Connecting citizens to their municipalities for a better Nepal.
              </p>
            </div>
            <div className="flex gap-12 text-sm">
              <div>
                <p className="text-[#94a3b8] font-semibold uppercase tracking-wider text-[10px] mb-3">
                  Platform
                </p>
                {["Issues", "Map View", "About"].map((t) => (
                  <p
                    key={t}
                    className="text-[#475569] hover:text-white cursor-pointer mb-2 transition-colors"
                  >
                    {t}
                  </p>
                ))}
              </div>
              <div>
                <p className="text-[#94a3b8] font-semibold uppercase tracking-wider text-[10px] mb-3">
                  Government
                </p>
                {["Admin Login", "Municipality Portal"].map((t) => (
                  <p
                    key={t}
                    className="text-[#475569] hover:text-white cursor-pointer mb-2 transition-colors"
                  >
                    {t}
                  </p>
                ))}
              </div>
            </div>
          </div>
          <div
            className="border-t border-[#1e293b] mt-10 pt-6 flex items-center
            justify-between text-xs text-[#475569]"
          >
            <p>© {new Date().getFullYear()} SmartNepal</p>
            <p>Built for Nepal 🇳🇵</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
