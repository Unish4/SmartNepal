import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Bell,
  Plus,
  FileText,
  Activity,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully.");
      navigate("/login");
    } catch (error) {
      toast.error(error?.message || "Failed to log out.");
    }
  };

  const isAdmin = user?.role === "admin";

  const navLinks = [
    { to: "/issues", label: "Issues", Icon: FileText },
    { to: "/issues/me", label: "My Reports", Icon: Activity },
    ...(isAdmin
      ? [{ to: "/admin", label: "Admin", Icon: ShieldCheck, admin: true }]
      : []),
  ];

  return (
    <nav
      className="h-16 bg-white/75 backdrop-blur-md border-b border-[#e2e8f0]/80 flex items-center
      px-4 sm:px-6 gap-4 sticky top-0 z-40"
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mr-2 shrink-0 group">
        <div
          className="w-8 h-8 rounded-lg bg-[#16a34a] flex items-center
          justify-center shadow-sm group-hover:bg-[#15803d] transition-colors"
        >
          <MapPin size={15} className="text-white" />
        </div>
        <span className="font-bold text-[#0f172a] text-[15px] tracking-tight">
          Smart<span className="text-[#16a34a]">Nepal</span>
        </span>
      </Link>

      {/* Centre nav links — authenticated only */}
      {isAuthenticated && (
        <div className="hidden md:flex items-center gap-0.5">
          {navLinks.map(({ to, label, Icon, admin }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                transition-colors ${
                  isActive
                    ? admin
                      ? "bg-purple-50 text-purple-700"
                      : "bg-[#f0fdf4] text-[#16a34a]"
                    : admin
                      ? "text-[#7c3aed] hover:bg-purple-50"
                      : "text-[#475569] hover:bg-[#f8fafc] hover:text-[#0f172a]"
                }`
              }
            >
              <Icon size={13} />
              {label}
            </NavLink>
          ))}
        </div>
      )}

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-2">
        {isAuthenticated ? (
          <>
            {/* Report issue button */}
            <button
              onClick={() => navigate("/issues/new")}
              className="flex items-center gap-1.5 px-4 h-9 rounded-lg
                bg-[#16a34a] hover:bg-[#15803d] text-white text-sm
                font-semibold transition-colors shadow-sm"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Report Issue</span>
              <span className="sm:hidden">Report</span>
            </button>

            {/* Notification bell */}
            <button
              aria-label="Notifications"
              className="relative w-9 h-9 rounded-lg hover:bg-[#f8fafc]
              text-[#475569] flex items-center justify-center transition-colors"
            >
              <Bell size={16} />
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500
                rounded-full border border-white"
              />
            </button>

            {/* User avatar + logout */}
            <div className="flex items-center gap-2">
              <button
                className="w-9 h-9 rounded-full bg-[#f0fdf4] text-[#16a34a]
                  font-bold text-xs border border-[#bbf7d0] flex items-center
                  justify-center hover:bg-[#dcfce7] transition-colors"
                title={user?.name}
              >
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </button>
              <button
                aria-label="Log out"
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-1 text-xs text-[#94a3b8]
                  hover:text-red-500 transition-colors"
              >
                <LogOut size={12} />
              </button>{" "}
            </div>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="hidden sm:block text-sm font-medium text-[#475569]
                hover:text-[#0f172a] transition-colors px-3 py-2 rounded-lg
                hover:bg-[#f8fafc]"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="flex items-center gap-1.5 px-4 h-9 rounded-lg
                bg-[#16a34a] hover:bg-[#15803d] text-white text-sm
                font-semibold transition-colors shadow-sm"
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
