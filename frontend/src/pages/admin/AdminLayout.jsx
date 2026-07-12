import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ListChecks,
  Users,
  BarChart2,
  LogOut,
  Menu,
  X,
  HardHat,
  ShieldCheck,
} from "lucide-react";
import useAuthStore from "../../store/useAuthStore.js";

const NAV_LINKS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/issues", label: "All Issues", icon: ListChecks },
  { to: "/admin/users", label: "Citizens", icon: Users },
  { to: "/admin/admins", label: "Admins", icon: ShieldCheck },
  { to: "/admin/field-workers",label: "Field Workers", icon: HardHat },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart2 },
];

// SidebarContent is extracted so it renders identically in both the
// fixed desktop sidebar and the mobile slide-in drawer.
const SidebarContent = ({ user, onLogout, onLinkClick }) => (
  <div className="flex flex-col h-full bg-[#0b0f19] text-slate-300">
    {/* Logo */}
    <div className="h-16 flex items-center px-6 border-b border-slate-800/60 shrink-0 gap-2.5">
      <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity cursor-pointer">
        <div className="w-8 h-8 flex items-center justify-center">
          <img src="/icon.png" alt="" className="w-full h-full rounded-lg" />
        </div>
        <span className="font-extrabold text-white text-[16px] tracking-tight shrink-0">
          Digital<span className="text-emerald-400">Sewa</span>
        </span>
      </Link>
      <span
        className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10
        border border-emerald-400/20 px-1.5 py-0.5 rounded-md shrink-0 uppercase tracking-wider"
      >
        Admin
      </span>
    </div>

    {/* Nav links */}
    <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
      <p
        className="text-[10px] font-bold text-slate-500 uppercase tracking-widest
        px-3 mb-4"
      >
        Manage Portal
      </p>
      {NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onLinkClick}
          className={({ isActive }) =>
            `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold
            transition-all duration-200 cursor-pointer
            ${
              isActive
                ? "bg-emerald-600/10 text-emerald-400 border-l-4 border-emerald-500 pl-3 shadow-inner"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`
          }
        >
          <Icon size={18} className="shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>

    {/* Admin info + logout */}
    <div className="border-t border-slate-800/60 p-5 shrink-0 bg-slate-950/30">
      <div className="flex items-center gap-3 mb-4.5">
        <div
          className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20
          flex items-center justify-center shrink-0 shadow-inner"
        >
          <span className="text-sm font-bold text-emerald-400">
            {user?.name?.[0]?.toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white truncate">{user?.name}</p>
          <p className="text-[10px] text-slate-500 truncate mt-0.5">
            {user?.email}
          </p>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="flex items-center gap-2 text-xs text-slate-500
          hover:text-rose-400 font-bold transition-colors cursor-pointer w-full"
      >
        <LogOut size={13} className="shrink-0" />
        Sign out
      </button>
    </div>
  </div>
);

const AdminLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login");
    }
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: "#f8fafc" }}
    >
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex flex-col w-60 shrink-0"
        style={{ backgroundColor: "#0f172a" }}
      >
        <SidebarContent
          user={user}
          onLogout={handleLogout}
          onLinkClick={() => {}}
        />
      </aside>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside
            className="relative flex flex-col w-60 z-10 shadow-2xl"
            style={{ backgroundColor: "#0f172a" }}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-[#475569] hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
            <SidebarContent
              user={user}
              onLogout={handleLogout}
              onLinkClick={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div
          className="md:hidden h-14 flex items-center justify-between px-4
            border-b shrink-0 bg-white"
          style={{ borderColor: "#e2e8f0" }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="text-[#475569] hover:text-[#0f172a] transition-colors"
          >
            <Menu size={20} />
          </button>
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer">
            <div className="w-8 h-8 flex items-center justify-center">
              <img
                src="/icon.png"
                alt=""
                className="w-full h-full rounded-lg"
              />
            </div>
            <span className="font-bold text-sm text-[#0f172a]">
              Admin Panel
            </span>
          </Link>
          <div className="w-6" />
        </div>

        {/* Page content — Outlet renders child pages here */}
        <main className="flex-1 overflow-y-auto p-5 md:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
