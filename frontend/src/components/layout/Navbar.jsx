import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Bell,
  Plus,
  FileText,
  Activity,
  ShieldCheck,
  LogOut,
  User,
} from "lucide-react";
import useAuthStore from "../../store/useAuthStore";

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore — proceed to navigate regardless
    } finally {
      navigate("/login");
    }
  };
  const isAdmin = user?.role === "admin";

  const navLinks = [
    { to: "/issues", label: "Issues", Icon: FileText },
    ...(isAdmin
      ? [{ to: "/admin", label: "Admin", Icon: ShieldCheck, admin: true }]
      : [{ to: "/issues/me", label: "My Reports", Icon: Activity }]),
  ];

  return (
    <nav
      className="h-16 bg-white border-b border-[#e2e8f0] flex items-center
      px-4 sm:px-6 gap-4 sticky top-0 z-40 shadow-sm"
    >
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2 mr-2 shrink-0 group">
        <div
          className="w-8 h-8 rounded-lg bg-[#16a34a] flex items-center
          justify-center shadow-sm group-hover:bg-[#15803d] transition-colors"
        >
          <MapPin size={15} className="text-white" />
        </div>
        <span className="font-bold text-[#0f172a] text-[15px] tracking-tight">
          Digital<span className="text-[#16a34a]">Sewa</span>
        </span>
      </Link>

      {/* Centre nav */}
      {isAuthenticated && (
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label, Icon, admin }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                font-semibold transition-all duration-200
                ${
                  isActive
                    ? admin
                      ? "bg-purple-50 text-purple-700 shadow-sm"
                      : "bg-[#f0fdf4] text-[#16a34a] shadow-sm"
                    : admin
                      ? "text-[#7c3aed] hover:bg-purple-50/50"
                      : "text-[#475569] hover:bg-[#f8fafc] hover:text-[#0f172a]"
                }`
              }
            >
              <Icon size={15} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      )}

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-3">
        {isAuthenticated ? (
          <>
            {/* Report issue - only for non-admin users */}
            {!isAdmin && (
              <button
                onClick={() => navigate("/issues/new")}
                className="flex items-center gap-2 px-4 h-9 rounded-lg
                  bg-[#16a34a] hover:bg-[#15803d] text-white text-sm
                  font-semibold transition-all shadow-sm hover:shadow-md"
              >
                <Plus size={15} />
                <span className="hidden sm:inline">Report Issue</span>
                <span className="sm:hidden">Report</span>
              </button>
            )}

            {/* Notification bell */}
            <button
              className="relative w-9 h-9 rounded-lg hover:bg-[#f8fafc]
              text-[#475569] flex items-center justify-center transition-colors"
              title="Notifications"
            >
              <Bell size={17} />
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500
                rounded-full border border-white"
              />
            </button>

            {/* Profile avatar — links to /profile */}
            <Link
              to="/profile"
              className="w-9 h-9 rounded-full bg-[#f0fdf4] text-[#16a34a]
                font-bold text-xs border border-[#bbf7d0] flex items-center
                justify-center hover:bg-[#dcfce7] transition-colors"
              title={`${user?.name} — View profile`}
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
                font-medium text-[#94a3b8] hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
              title="Sign out"
            >
              <LogOut size={13} />
              <span>Sign out</span>
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
              Sign in
            </Link>
            <Link
              to="/register"
              className="flex items-center gap-2 px-4 h-9 rounded-lg
                bg-[#16a34a] hover:bg-[#15803d] text-white text-sm
                font-semibold transition-all shadow-sm hover:shadow-md"
            >
              Get started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
