import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, ClipboardList, User as UserIcon } from "lucide-react";
import useAuthStore from "../../store/useAuthStore.js";

const BOTTOM_TABS = [
  { to: "/field", label: "Assignments", Icon: ClipboardList, end: true },
  { to: "/profile", label: "Profile", Icon: UserIcon },
];

const FieldLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore — proceed to navigate regardless
    } finally {
      navigate("/login");
    }
  };
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#f8fafc" }}
    >
      {/* Compact top bar  */}
      <div
        className="h-16 bg-white border-b border-[#e2e8f0] flex items-center
        justify-between px-4 sticky top-0 z-40 shadow-sm shrink-0"
      >
        <div className="flex items-center gap-2.5">
          <Link
            to="/"
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <img
                src="/icon.png"
                alt=""
                className="w-full h-full rounded-lg"
              />
            </div>
            <span className="font-bold text-[#0f172a] text-[15px] tracking-tight">
              Digital<span className="text-[#16a34a]">Sewa</span>
            </span>
          </Link>
          <span
            className="text-[9px] font-bold text-[#16a34a] bg-[#f0fdf4]
            border border-[#bbf7d0] px-1.5 py-0.5 rounded uppercase tracking-wider"
          >
            Field
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#94a3b8]
            hover:text-red-500 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
        >
          <LogOut size={13} />
          <span>Sign out</span>
        </button>
      </div>

      {/* Page content  */}
      <main className="flex-1 px-4 py-4 pb-24 max-w-lg mx-auto w-full">
        <Outlet />
      </main>

      {/* Fixed bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t
        border-[#e2e8f0] flex items-center justify-around h-16 z-40 shadow-lg"
      >
        {BOTTOM_TABS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 flex-1 h-full
              transition-colors ${
                isActive ? "text-[#16a34a]" : "text-[#64748b]"
              } hover:text-[#16a34a] cursor-pointer`
            }
          >
            <Icon size={20} />
            <span className="text-[10px] font-semibold">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default FieldLayout;
