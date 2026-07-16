import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  Plus,
  FileText,
  ShieldCheck,
  LogOut,
  User,
  HardHat,
  Download,
  Flame,
} from "lucide-react";
import useAuthStore from "../../store/useAuthStore";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import useOfflineStore from "../../store/useOfflineStore.js";
import NotificationBell from "./NotificationBell.jsx";

const Navbar = () => {
  const { t, i18n } = useTranslation("navbar");
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { deferredPrompt, showIosInstallHint, isStandalone } = useOfflineStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore — proceed to navigate regardless
    } finally {
      navigate("/login");
    }
  };
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isFieldWorker = user?.role === "field_worker";

  const navLinks = [
    { to: "/issues", label: t("issues"), Icon: FileText },
    ...(!isAdmin && !isFieldWorker && isAuthenticated
      ? [
          {
            to: "/issues/me",
            label: t("myReports"),
            Icon: FileText,
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            to: "/admin",
            label: t("admin"),
            Icon: ShieldCheck,
            admin: true,
          },
        ]
      : []),
    ...(isFieldWorker
      ? [
          {
            to: "/field",
            label: t("fieldTasks"),
            Icon: HardHat,
            field: true,
          },
        ]
      : []),
  ];

  return (
    <nav
      className="h-16 bg-white border-b border-[#e2e8f0] flex items-center
      px-4 sm:px-6 gap-4 sticky top-0 z-40 shadow-sm"
    >
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2 mr-2 shrink-0 group">
        <div className="w-8 h-8 flex items-center justify-center">
          <img src="/icon.png" alt="" className="w-full h-full rounded-lg" />
        </div>
        <span className="font-bold text-[#0f172a] text-[15px] tracking-tight">
          {i18n.language === "ne" ? (
            <>
              नेपाल<span className="text-[#16a34a]"> सेवा</span>
            </>
          ) : (
            <>
              Nepal<span className="text-[#16a34a]">Sewa</span>
            </>
          )}
        </span>
      </Link>

      {/* Centre nav */}
      <div className="hidden md:flex items-center gap-1">
        <NavLink
          to="/map"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? "bg-[#f0fdf4] text-[#16a34a]"
                : "text-[#475569] hover:bg-[#f8fafc] hover:text-[#0f172a]"
            }`
          }
        >
          <Flame size={15} />
          <span>{i18n.language === "ne" ? "नक्सा" : "Map"}</span>
        </NavLink>
        {navLinks.map(({ to, label, Icon, admin, field }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? admin
                    ? "bg-purple-50 text-purple-700"
                    : field
                      ? "bg-amber-50 text-amber-700"
                      : "bg-[#f0fdf4] text-[#16a34a]"
                  : admin
                    ? "text-[#7c3aed] hover:bg-purple-50"
                    : field
                      ? "text-amber-600 hover:bg-amber-50"
                      : "text-[#475569] hover:bg-[#f8fafc] hover:text-[#0f172a]"
              }`
            }
          >
            <Icon size={15} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-3">
        {!isStandalone && (deferredPrompt || showIosInstallHint) && (
          <button
            onClick={() => useOfflineStore.getState().setShowInstallModal(true)}
            className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-[#cbd5e1]
              text-[#475569] hover:text-[#16a34a] hover:border-[#16a34a] hover:bg-[#f0fdf4]
              text-xs font-semibold transition-all cursor-pointer shrink-0"
            title={t("common:pwa.installApp")}
          >
            <Download size={13} />
            <span className="hidden sm:inline">{t("common:pwa.installShort")}</span>
          </button>
        )}
        <LanguageSwitcher />
        {isAuthenticated ? (
          <>
            {/* Report issue - only for citizen users (not admin or field workers) */}
            {!isAdmin && !isFieldWorker && (
              <button
                onClick={() => navigate("/issues/new")}
                className="flex items-center gap-2 px-4 h-9 rounded-lg
                  bg-[#16a34a] hover:bg-[#15803d] text-white text-sm
                  font-semibold transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                <Plus size={15} />
                <span className="hidden sm:inline">{t("reportIssue")}</span>
                <span className="sm:hidden">{t("report")}</span>
              </button>
            )}

            {/* Notification bell */}
            <NotificationBell />

            {/* Profile avatar — links to /profile */}
            <Link
              to="/profile"
              className="w-9 h-9 rounded-full bg-[#f0fdf4] text-[#16a34a]
                font-bold text-xs border border-[#bbf7d0] flex items-center
                justify-center hover:bg-[#dcfce7] transition-colors"
              title={`${user?.name} — ${t("viewProfile")}`}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                (user?.name?.[0]?.toUpperCase() ?? <User size={14} />)
              )}
            </Link>

            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-1.5 text-sm
                font-medium text-[#94a3b8] hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
              title={t("signOut")}
            >
              <LogOut size={13} />
              <span>{t("signOut")}</span>
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="hidden sm:block text-sm font-semibold text-[#475569]
                hover:text-[#0f172a] transition-colors px-4 py-2 rounded-lg
                hover:bg-[#f8fafc]"
            >
              {t("signIn")}
            </Link>
            <Link
              to="/register"
              className="flex items-center gap-2 px-4 h-9 rounded-lg
                bg-[#16a34a] hover:bg-[#15803d] text-white text-sm
                font-semibold transition-all shadow-sm hover:shadow-md"
            >
              {t("getStarted")}
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
