import { useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Bell,
  BellOff,
  ClipboardList,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  Camera,
  Loader2,
  X,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../store/useAuthStore.js";
import { NEPAL_LOCATIONS, getDistricts, getCities } from "../constants/nepalLocations.js";

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className="relative w-11 h-6 rounded-full transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30
      disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
    style={{ backgroundColor: checked ? "#16a34a" : "#cbd5e1" }}
  >
    <span
      className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full
        shadow-sm transition-transform duration-200"
      style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
    />
  </button>
);

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-[#e2e8f0] rounded ${className}`} />
);

function ProfileSkeleton() {
  return (
    <div className="bg-[#f8fafc]">
      <section className="bg-white border-b border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
          <Skeleton className="h-6 w-28 rounded-full mb-5" />
          <Skeleton className="h-10 w-56 mb-3" />
          <Skeleton className="h-5 w-80" />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-72 rounded-2xl" />
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-56 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ProfilePage() {
  const { user, updatePreferences, updateProfile, uploadAvatar } = useAuthStore();

  const [emailNotif, setEmailNotif] = useState(
    user?.emailNotifications ?? true,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState(user?.district || "");
  const [editForm, setEditForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    province: user?.province || "",
    district: user?.district || "",
    city: user?.city || "",
  });

  const handleToggle = async (newValue) => {
    setEmailNotif(newValue);
    setIsSaving(true);
    try {
      await updatePreferences({ emailNotifications: newValue });
      toast.success(
        newValue
          ? "Email notifications enabled"
          : "Email notifications disabled",
      );
    } catch {
      setEmailNotif(!newValue);
      toast.error("Failed to save preference. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      toast.success("Avatar updated successfully");
    } catch {
      toast.error("Failed to upload avatar. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(editForm);
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCancel = () => {
    setEditForm({
      name: user?.name || "",
      phone: user?.phone || "",
      province: user?.province || "",
      district: user?.district || "",
      city: user?.city || "",
    });
    setSelectedDistrict(user?.district || "");
    setIsEditing(false);
  };

  const districts = editForm.province ? getDistricts(editForm.province) : [];
  const cities = selectedDistrict ? getCities(editForm.province, selectedDistrict) : [];

  if (!user) {
    return <ProfileSkeleton />;
  }

  const INFO_ROWS = [
    { icon: User, label: "Full name", value: user.name },
    { icon: Mail, label: "Email", value: user.email },
    { icon: Phone, label: "Phone", value: user.phone || "Not set" },
    { icon: MapPin, label: "Province", value: user.province || "Not set" },
    { icon: MapPin, label: "District", value: user.district || "Not set" },
    { icon: MapPin, label: "City", value: user.city || "Not set" },
  ];

  const quickLinks = [
    {
      to: "/issues/me",
      icon: ClipboardList,
      label: "My Reports",
      sub: "View and manage issues you've reported",
      color: "#16a34a",
      bg: "#f0fdf4",
    },
    ...(user.role === "admin"
      ? [
          {
            to: "/admin",
            icon: ShieldCheck,
            label: "Admin Panel",
            sub: "Access the municipality dashboard",
            color: "#7c3aed",
            bg: "#f5f3ff",
          },
        ]
      : []),
  ];

  return (
    <div className="bg-[#f8fafc]">
      {/* Hero header — matches HomePage section style */}
      <section className="bg-white border-b border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
          <div
            className="inline-flex items-center gap-2 bg-[#f0fdf4] text-[#16a34a]
            text-xs font-semibold px-3 py-1.5 rounded-full border border-[#bbf7d0] mb-5"
          >
            <User size={11} />
            Your SmartNepal account
          </div>

          <h1
            className="text-3xl md:text-4xl font-bold text-[#0f172a]
            tracking-tight leading-tight mb-3"
          >
            My Profile
          </h1>
          <p className="text-[#475569] text-base md:text-lg max-w-2xl leading-relaxed">
            Manage your account details and notification preferences in one place.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-10 md:py-14">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile card — left column */}
          <div
            className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-7
            hover:shadow-md hover:border-[#16a34a]/20 transition-all h-fit"
          >
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-5">
                <div
                  className="w-24 h-24 rounded-2xl bg-[#f0fdf4] border-2 border-[#bbf7d0]
                  flex items-center justify-center shadow-sm overflow-hidden"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-[#16a34a]">
                      {user.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#16a34a]
                    text-white flex items-center justify-center cursor-pointer
                    hover:bg-[#15803d] transition-colors shadow-sm"
                  title="Upload avatar"
                >
                  {isUploadingAvatar ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Camera size={14} />
                  )}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              <h2 className="text-xl font-bold text-[#0f172a] mb-1">
                {user.name}
              </h2>
              <p className="text-sm text-[#64748b] mb-4">{user.email}</p>

              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold
                px-3 py-1.5 rounded-full ${
                  user.role === "admin"
                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                    : "bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]"
                }`}
              >
                {user.role === "admin" ? (
                  <ShieldCheck size={12} />
                ) : (
                  <CheckCircle size={12} />
                )}
                {user.role === "admin" ? "Administrator" : "Citizen"}
              </span>
            </div>

            <div className="mt-7 pt-6 border-t border-[#f1f5f9] space-y-3">
              {[
                user.province && {
                  label: "Province",
                  value: user.province,
                },
                user.phone && { label: "Phone", value: user.phone },
              ]
                .filter(Boolean)
                .map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-[#94a3b8]">{label}</span>
                    <span className="font-medium text-[#0f172a]">{value}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Settings — right column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account information */}
            <div
              className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm
              overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="px-6 py-5 border-b border-[#f1f5f9] flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#0f172a]">
                    Account Information
                  </h3>
                  <p className="text-sm text-[#94a3b8] mt-0.5">
                    Your registered details on SmartNepal
                  </p>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm font-semibold text-[#16a34a] hover:text-[#15803d] transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                      Full name
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15 transition-all bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="98XXXXXXXX"
                      className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] placeholder:text-[#94a3b8] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15 transition-all bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                      Province
                    </label>
                    <div className="relative">
                      <select
                        value={editForm.province}
                        onChange={(e) => {
                          setEditForm({ ...editForm, province: e.target.value, district: "", city: "" });
                          setSelectedDistrict("");
                        }}
                        className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15 transition-all bg-white cursor-pointer appearance-none"
                        style={{ paddingRight: "2.5rem" }}
                      >
                        <option value="">Select your province</option>
                        {Object.keys(NEPAL_LOCATIONS).map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                      District
                    </label>
                    <div className="relative">
                      <select
                        value={editForm.district}
                        onChange={(e) => {
                          setEditForm({ ...editForm, district: e.target.value, city: "" });
                          setSelectedDistrict(e.target.value);
                        }}
                        disabled={!editForm.province}
                        className={`w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15 transition-all bg-white cursor-pointer appearance-none ${!editForm.province ? "opacity-50 cursor-not-allowed" : ""}`}
                        style={{ paddingRight: "2.5rem" }}
                      >
                        <option value="">
                          {editForm.province ? "Select your district" : "Select a province first"}
                        </option>
                        {districts.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                      City/Municipality
                    </label>
                    <div className="relative">
                      <select
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        disabled={!selectedDistrict}
                        className={`w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15 transition-all bg-white cursor-pointer appearance-none ${!selectedDistrict ? "opacity-50 cursor-not-allowed" : ""}`}
                        style={{ paddingRight: "2.5rem" }}
                      >
                        <option value="">
                          {selectedDistrict ? "Select your city" : "Select a district first"}
                        </option>
                        {cities.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 h-10 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-sm transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleEditCancel}
                      disabled={isSaving}
                      className="px-4 h-10 rounded-lg border border-[#e2e8f0] text-[#475569] font-semibold text-sm hover:bg-[#f8fafc] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid sm:grid-cols-2 gap-px bg-[#f1f5f9]">
                  {INFO_ROWS.map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="bg-white p-5 flex items-start gap-4
                      hover:bg-[#fafafa] transition-colors"
                    >
                      <div
                        className="w-10 h-10 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]
                        flex items-center justify-center shrink-0"
                      >
                        <Icon size={16} className="text-[#64748b]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-[#94a3b8] font-medium uppercase tracking-wide">
                          {label}
                        </p>
                        <p className="text-sm text-[#0f172a] font-semibold mt-1 truncate">
                          {value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notification preferences */}
            <div
              className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm
              overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="px-6 py-5 border-b border-[#f1f5f9]">
                <h3 className="text-lg font-bold text-[#0f172a]">
                  Notification Preferences
                </h3>
                <p className="text-sm text-[#94a3b8] mt-0.5">
                  Choose how SmartNepal keeps you updated
                </p>
              </div>

              <div className="p-6">
                <div
                  className="rounded-2xl border p-5 flex items-start gap-4 transition-colors"
                  style={{
                    backgroundColor: emailNotif ? "#f0fdf4" : "#f8fafc",
                    borderColor: emailNotif ? "#bbf7d0" : "#e2e8f0",
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: emailNotif ? "#dcfce7" : "#f1f5f9",
                    }}
                  >
                    {emailNotif ? (
                      <Bell size={18} className="text-[#16a34a]" />
                    ) : (
                      <BellOff size={18} className="text-[#94a3b8]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[#0f172a]">
                          Email notifications
                        </p>
                        <p className="text-xs text-[#64748b] mt-1 leading-relaxed max-w-md">
                          Receive email updates when your report is verified,
                          assigned, resolved, or rejected by the municipality.
                        </p>
                      </div>
                      <Toggle
                        checked={emailNotif}
                        onChange={handleToggle}
                        disabled={isSaving}
                      />
                    </div>

                    <p
                      className="text-xs font-medium mt-3 flex items-center gap-1.5"
                      style={{ color: emailNotif ? "#16a34a" : "#94a3b8" }}
                    >
                      {isSaving ? (
                        "Saving…"
                      ) : emailNotif ? (
                        <>
                          <CheckCircle size={12} />
                          You will receive status updates by email
                        </>
                      ) : (
                        "Email notifications are turned off"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick links — HomePage category-card style */}
            <div
              className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm
              overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="px-6 py-5 border-b border-[#f1f5f9]">
                <h3 className="text-lg font-bold text-[#0f172a]">Quick Links</h3>
                <p className="text-sm text-[#94a3b8] mt-0.5">
                  Jump to your reports and tools
                </p>
              </div>

              <div className="p-6 grid sm:grid-cols-2 gap-4">
                {quickLinks.map(({ to, icon: Icon, label, sub, color, bg }) => (
                  <Link
                    key={to}
                    to={to}
                    className="rounded-2xl p-5 border border-[#e2e8f0] flex items-start
                      gap-4 hover:shadow-md hover:border-[#cbd5e1] hover:-translate-y-0.5
                      transition-all duration-200 group"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                      group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: bg }}
                    >
                      <Icon size={18} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#0f172a]">
                          {label}
                        </p>
                        <ChevronRight
                          size={14}
                          className="text-[#cbd5e1] group-hover:text-[#16a34a]
                          transition-colors shrink-0"
                        />
                      </div>
                      <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                        {sub}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
