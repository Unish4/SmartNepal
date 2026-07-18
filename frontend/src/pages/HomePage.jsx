import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import { useIssueLabels } from "../hooks/useIssueLabels.js";

const CATEGORIES = [
  {
    key: "Road Damage",
    Icon: AlertTriangle,
    color: "#64748b",
    bg: "#f1f5f9",
  },
  {
    key: "Garbage",
    Icon: Trash2,
    color: "#65a30d",
    bg: "#f7fee7",
  },
  {
    key: "Water Issue",
    Icon: Droplets,
    color: "#0284c7",
    bg: "#f0f9ff",
  },
  {
    key: "Street Light",
    Icon: Lightbulb,
    color: "#ca8a04",
    bg: "#fefce8",
  },
  {
    key: "Illegal Construction",
    Icon: Building2,
    color: "#ea580c",
    bg: "#fff7ed",
  },
  {
    key: "Public Space",
    Icon: Trees,
    color: "#16a34a",
    bg: "#f0fdf4",
  },
];

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();
  const {
    getCategoryLabel,
    getCategoryDescription,
    getStatusLabel,
    getPriorityLabel,
  } = useIssueLabels();

  const HOW_IT_WORKS = [
    {
      n: "01",
      Icon: MapPin,
      title: t("home.step1Title"),
      desc: t("home.step1Desc"),
    },
    {
      n: "02",
      Icon: TrendingUp,
      title: t("home.step2Title"),
      desc: t("home.step2Desc"),
    },
    {
      n: "03",
      Icon: CheckCircle,
      title: t("home.step3Title"),
      desc: t("home.step3Desc"),
    },
  ];

  return (
    <div className="bg-[#f8fafc]">
      {/* ── Hero  */}
      <section className="bg-white border-b border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left */}
            <div className="flex-1">
              <h1
                className="text-4xl md:text-5xl font-bold text-[#0f172a]
                tracking-tight leading-[1.1] mb-5"
              >
                {t("home.headline1")}
                <br />
                {i18n.language === "ne" ? (
                  <>
                    राम्रो <span className="text-[#16a34a]">नेपाल।</span>
                  </>
                ) : (
                  <>
                    {t("home.headline2")}{" "}
                    <span className="text-[#16a34a]">Nepal.</span>
                  </>
                )}
              </h1>

              <p className="text-[#475569] text-lg leading-relaxed mb-8 max-w-130">
                {t("home.subtitle")}
              </p>

              <div className="flex flex-wrap gap-3 mb-6">
                {(!isAuthenticated ||
                  (user?.role !== "admin" &&
                    user?.role !== "field_worker" &&
                    user?.role !== "super_admin")) && (
                  <Link
                    to={isAuthenticated ? "/issues/new" : "/register"}
                    className="inline-flex items-center gap-2 h-12 px-7 rounded-xl
                      bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-[15px]
                      transition-colors shadow-sm"
                  >
                    {t("home.ctaReport")}
                  </Link>
                )}
                <Link
                  to="/issues"
                  className="inline-flex items-center gap-2 h-12 px-7 rounded-xl
                    border border-[#e2e8f0] text-[#475569] font-semibold text-[15px]
                    hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-all"
                >
                  {t("home.ctaView")}
                </Link>
              </div>

              <div className="flex items-center gap-5 text-xs text-[#94a3b8]">
                {[t("home.trust1"), t("home.trust2"), t("home.trust3")].map(
                  (text, i) => (
                    <span key={text} className="flex items-center gap-1.5">
                      {i > 0 && <span className="text-[#e2e8f0]">·</span>}
                      <CheckCircle size={11} className="text-[#16a34a]" />
                      {text}
                    </span>
                  ),
                )}
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
                    {getStatusLabel("open")}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-[#f1f5f9] text-[#64748b] text-[10px] font-medium px-2 py-0.5 rounded">
                      {getCategoryLabel("Road Damage")}
                    </span>
                    <span className="bg-[#fff7ed] text-[#ea580c] text-[10px] font-medium px-2 py-0.5 rounded">
                      {getPriorityLabel("high")}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#0f172a] line-clamp-2 mb-1">
                    {t("home.mockTitle")}
                  </p>
                  <p className="text-xs text-[#64748b] mb-3 line-clamp-2">
                    {t("home.mockDesc")}
                  </p>
                  <div className="flex items-center justify-between text-xs text-[#94a3b8] pt-2 border-t border-[#f1f5f9]">
                    <span className="flex items-center gap-1">
                      <MapPin size={10} />
                      {t("home.mockLocation")}
                    </span>
                    <span>{t("home.mockTime")}</span>
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
            {t("home.howItWorksTitle")}
          </h2>
          <p className="text-[#94a3b8] text-center mb-10">
            {t("home.howItWorksSubtitle")}
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
                  {i18n.language === "ne"
                    ? n === "01"
                      ? "०१"
                      : n === "02"
                        ? "०२"
                        : "०३"
                    : n}
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
            {t("home.categoriesTitle")}
          </h2>
          <p className="text-[#94a3b8] text-center mb-10">
            {t("home.categoriesSubtitle")}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CATEGORIES.map(({ Icon, key, color, bg }) => (
              <Link
                key={key}
                to={`/issues?category=${encodeURIComponent(key)}`}
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
                    {getCategoryLabel(key)}
                  </h3>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    {getCategoryDescription(key)}
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
                <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src="/icon.png"
                    alt=""
                    className="w-full h-full object-contain"
                  />{" "}
                </div>
                <span className="font-bold text-white text-[15px] flex items-center gap-1.5">
                  <span>NepalSewa</span>
                  <span className="text-[#64748b] text-xs">/</span>
                  <span className="font-medium text-[#94a3b8] text-sm">
                    नेपाल सेवा
                  </span>
                </span>
              </div>
              <p className="text-[#64748b] text-xs leading-relaxed max-w-64">
                Connecting citizens to their municipalities for a better Nepal.
              </p>
              <p className="text-[#475569] text-xs leading-relaxed mt-1 max-w-64">
                राम्रो नेपालका लागि नागरिकहरूलाई नगरपालिकासँग जोड्दै।
              </p>
            </div>
            <div className="flex flex-col gap-8 text-sm md:flex-row md:flex-wrap md:gap-12">
              <div>
                <p className="text-[#94a3b8] font-semibold uppercase tracking-wider text-[10px] mb-3">
                  {t("home.footerPlatform")}
                </p>
                <Link
                  to="/issues"
                  className="block text-[#475569] hover:text-white mb-2 transition-colors text-left"
                >
                  {t("nav.issues")}
                </Link>
                <Link
                  to="/issues/me"
                  className="block text-[#475569] hover:text-white mb-2 transition-colors text-left"
                >
                  {t("nav.myReports")}
                </Link>
                <Link
                  to="/map"
                  className="text-[#475569] hover:text-white cursor-pointer mb-2 transition-colors block"
                >
                  {t("home.footerMapView")}
                </Link>{" "}
                <Link
                  to="/scorecard"
                  className="block text-[#475569] hover:text-white mb-2 transition-colors text-left"
                >
                  {t("home.footerScorecards")}
                </Link>
              </div>
              <div>
                <p className="text-[#94a3b8] font-semibold uppercase tracking-wider text-[10px] mb-3">
                  {t("home.footerGovernment")}
                </p>
                <Link
                  to="/login"
                  className="block text-[#475569] hover:text-white mb-2 transition-colors text-left"
                >
                  {t("profile.quickLinks") === "छिटो लिङ्कहरू"
                    ? "कर्मचारी लगइन"
                    : "Staff Login"}
                </Link>
                <Link
                  to="/login"
                  className="block text-[#475569] hover:text-white mb-2 transition-colors text-left"
                >
                  {t("home.footerAdminLogin")}
                </Link>
              </div>
              <div>
                <p className="text-[#94a3b8] font-semibold uppercase tracking-wider text-[10px] mb-3">
                  {t("home.footerDevelopers")}
                </p>
                <a
                  href={`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/docs`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#475569] hover:text-white cursor-pointer mb-2 transition-colors block"
                >
                  {t("home.footerApiDocs")}
                </a>
              </div>
            </div>
            
          </div>
          <div
            className="border-t border-[#1e293b] mt-10 pt-6 flex items-center
            justify-between text-xs text-[#475569]"
          >
            <p>
              © {new Date().getFullYear()} {t("app.name")}
            </p>
            <p>{t("home.footerBuiltFor")} 🇳🇵</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
