import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  HardHat,
  Languages,
  Check,
  Download,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../store/useAuthStore.js";
import useOfflineStore from "../store/useOfflineStore.js";
import {
  NEPAL_LOCATIONS,
  getDistricts,
  getCities,
} from "../constants/nepalLocations.js";
import { ProfileSkeleton } from "../components/ui/SkeletonLoader.jsx";
import { ROLE_CONFIG } from "../constants/issue.js";

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

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ne", label: "नेपाली",  flag: "🇳🇵" },
];

export default function ProfilePage() {
  const { t, i18n } = useTranslation(["common", "auth"]);
  const { user, updatePreferences, updateProfile, uploadAvatar } =
    useAuthStore();
  const { deferredPrompt, showIosInstallHint, isStandalone, needRefresh, updateServiceWorker } = useOfflineStore();

  const [emailNotif, setEmailNotif] = useState(
    user?.emailNotifications ?? true,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [langSaving, setLangSaving] = useState(false);

  const [selectedDistrict, setSelectedDistrict] = useState(
    user?.district || "",
  );
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
      toast.success(newValue ? t("profile.emailNotifOn") : t("profile.emailNotifOff"));
    } catch {
      setEmailNotif(!newValue);
      toast.error("Failed to save preference. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLanguageChange = async (code) => {
    if (code === i18n.language) return;
    i18n.changeLanguage(code);
    setLangSaving(true);
    try {
      await updatePreferences({ preferredLanguage: code });
    } catch {
      toast.error("Failed to save language preference.");
    } finally {
      setLangSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        i18n.language === "ne"
          ? "फाइल साइज ५MB भन्दा कम हुनुपर्छ"
          : "File size must be less than 5MB",
      );
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error(
        i18n.language === "ne"
          ? "कृपया एउटा इमेज फाइल अपलोड गर्नुहोस्"
          : "Please upload an image file",
      );
      return;
    }

    setIsUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      toast.success(
        i18n.language === "ne"
          ? "अवतार सफलतापूर्वक अपडेट गरियो"
          : "Avatar updated successfully",
      );
    } catch {
      toast.error(
        i18n.language === "ne"
          ? "अवतार अपलोड गर्न असफल भयो। फेरि प्रयास गर्नुहोस्।"
          : "Failed to upload avatar. Please try again.",
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(editForm);
      toast.success(
        i18n.language === "ne"
          ? "प्रोफाइल सफलतापूर्वक अपडेट गरियो"
          : "Profile updated successfully",
      );
      setIsEditing(false);
    } catch {
      toast.error(
        i18n.language === "ne"
          ? "प्रोफाइल अपडेट गर्न असफल भयो। फेरि प्रयास गर्नुहोस्।"
          : "Failed to update profile. Please try again.",
      );
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
  const cities = selectedDistrict
    ? getCities(editForm.province, selectedDistrict)
    : [];

  if (!user) {
    return <ProfileSkeleton />;
  }

  const INFO_ROWS = [
    { icon: User, label: t("profile.fullName"), value: user.name },
    { icon: Mail, label: t("profile.email"), value: user.email },
    { icon: Phone, label: t("profile.phone"), value: user.phone || t("profile.notSet") },
    { icon: MapPin, label: t("profile.province"), value: user.province || t("profile.notSet") },
    { icon: MapPin, label: t("auth:register.district"), value: user.district || t("profile.notSet") },
    { icon: MapPin, label: t("auth:register.city"), value: user.city || t("profile.notSet") },
  ];

  const roleLabel = user.role === "admin"
    ? t("profile.administrator")
    : user.role === "field_worker"
    ? t("profile.fieldWorker")
    : t("profile.citizen");

  const quickLinks = [
    ...(user.role !== "admin" && user.role !== "field_worker"
      ? [
          {
            to: "/issues/me",
            icon: ClipboardList,
            label: t("nav.myReports"),
            sub: t("profile.myReportsDesc"),
            color: "#16a34a",
            bg: "#f0fdf4",
          },
        ]
      : []),
    ...(user.role === "admin"
      ? [
          {
            to: "/admin",
            icon: ShieldCheck,
            label: t("nav.admin"),
            sub: t("profile.adminPanelDesc"),
            color: "#7c3aed",
            bg: "#f5f3ff",
          },
        ]
      : []),
    ...(user.role === "field_worker"
      ? [
          {
            to: "/field",
            icon: HardHat,
            label: t("nav.fieldTasks"),
            sub: t("profile.fieldTasksDesc"),
            color: "#16a34a",
            bg: "#f0fdf4",
          },
        ]
      : []),
    ...(!isStandalone && (deferredPrompt || showIosInstallHint)
      ? [
          {
            onClick: () => useOfflineStore.getState().setShowInstallModal(true),
            icon: Download,
            label: i18n.language === "ne" ? "एप डाउनलोड गर्नुहोस्" : "Install App",
            sub: i18n.language === "ne" ? "तपाईंको उपकरणमा नेपालसेवा डाउनलोड गर्नुहोस्" : "Install NepalSewa on your device",
            color: "#16a34a",
            bg: "#f0fdf4",
          },
        ]
      : []),
    {
      onClick: () => {
        if (needRefresh && updateServiceWorker) {
          updateServiceWorker();
        } else {
          window.location.reload();
        }
      },
      icon: RefreshCw,
      label: needRefresh
        ? (i18n.language === "ne" ? "एप अपडेट गर्नुहोस्" : "Update App")
        : (i18n.language === "ne" ? "एप पुनः लोड गर्नुहोस्" : "Reload App"),
      sub: needRefresh
        ? (i18n.language === "ne" ? "नयाँ संस्करण उपलब्ध छ, तुरुन्तै लोड गर्नुहोस्" : "A new version is available. Click to reload and update.")
        : (i18n.language === "ne" ? "रिफ्रेस गर्न वा अपडेटहरू जाँच गर्न क्लिक गर्नुहोस्" : "Click to refresh or check for updates."),
      color: needRefresh ? "#d97706" : "#475569",
      bg: needRefresh ? "#fffbeb" : "#f1f5f9",
      badge: needRefresh ? (i18n.language === "ne" ? "अपडेट उपलब्ध" : "Update Available") : null,
    },
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
            {i18n.language === "ne" ? "तपाईंको नेपाल सेवा खाता" : "Your NepalSewa account"}
          </div>

          <h1
            className="text-3xl md:text-4xl font-bold text-[#0f172a]
            tracking-tight leading-tight mb-3"
          >
            {t("profile.title")}
          </h1>
          <p className="text-[#475569] text-base md:text-lg max-w-2xl leading-relaxed">
            {t("profile.subtitle")}
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
                  title={i18n.language === "ne" ? "अवतार अपलोड गर्नुहोस्" : "Upload avatar"}
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
                className="inline-block mt-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border"
                style={{
                  color: ROLE_CONFIG[user.role]?.color ?? "#64748b",
                  backgroundColor: ROLE_CONFIG[user.role]?.bg ?? "#f1f5f9",
                  borderColor: ROLE_CONFIG[user.role]?.border ?? "#e2e8f0",
                }}
              >
                {roleLabel}
              </span>
            </div>

            <div className="mt-7 pt-6 border-t border-[#f1f5f9] space-y-3">
              {[
                user.province && {
                  label: t("profile.province"),
                  value: user.province,
                },
                user.phone && { label: t("profile.phone"), value: user.phone },
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
                    {t("profile.accountInfo")}
                  </h3>
                  <p className="text-sm text-[#94a3b8] mt-0.5">
                    {i18n.language === "ne" ? "नेपाल सेवामा तपाईंको दर्ता गरिएको विवरण" : "Your registered details on NepalSewa"}
                  </p>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm font-semibold text-[#16a34a] hover:text-[#15803d] transition-colors cursor-pointer"
                  >
                    {t("actions.edit")}
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                      {t("profile.fullName")}
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15 transition-all bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                      {t("profile.phone")}
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                      placeholder="98XXXXXXXX"
                      className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] placeholder:text-[#94a3b8] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15 transition-all bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                      {t("profile.province")}
                    </label>
                    <div className="relative">
                      <select
                        value={editForm.province}
                        onChange={(e) => {
                          setEditForm({
                            ...editForm,
                            province: e.target.value,
                            district: "",
                            city: "",
                          });
                          setSelectedDistrict("");
                        }}
                        className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15 transition-all bg-white cursor-pointer appearance-none"
                        style={{ paddingRight: "2.5rem" }}
                      >
                        <option value="">{t("auth:register.provincePlaceholder")}</option>
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
                      {t("auth:register.district")}
                    </label>
                    <div className="relative">
                      <select
                        value={editForm.district}
                        onChange={(e) => {
                          setEditForm({
                            ...editForm,
                            district: e.target.value,
                            city: "",
                          });
                          setSelectedDistrict(e.target.value);
                        }}
                        disabled={!editForm.province}
                        className={`w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15 transition-all bg-white cursor-pointer appearance-none ${!editForm.province ? "opacity-50 cursor-not-allowed" : ""}`}
                        style={{ paddingRight: "2.5rem" }}
                      >
                        <option value="">
                          {editForm.province
                            ? t("auth:register.districtPlaceholder")
                            : t("auth:register.districtPlaceholderNoProvince")}
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
                      {t("auth:register.city")}
                    </label>
                    <div className="relative">
                      <select
                        value={editForm.city}
                        onChange={(e) =>
                          setEditForm({ ...editForm, city: e.target.value })
                        }
                        disabled={!selectedDistrict}
                        className={`w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15 transition-all bg-white cursor-pointer appearance-none ${!selectedDistrict ? "opacity-50 cursor-not-allowed" : ""}`}
                        style={{ paddingRight: "2.5rem" }}
                      >
                        <option value="">
                          {selectedDistrict
                            ? t("auth:register.cityPlaceholder")
                            : t("auth:register.cityPlaceholderNoDistrict")}
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
                      className="flex-1 h-10 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-sm transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          {t("profile.saving")}
                        </>
                      ) : (
                        t("actions.save")
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleEditCancel}
                      disabled={isSaving}
                      className="px-4 h-10 rounded-lg border border-[#e2e8f0] text-[#475569] font-semibold text-sm hover:bg-[#f8fafc] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                    >
                      <X size={14} />
                      {t("actions.cancel")}
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
                  {t("profile.notificationPrefs")}
                </h3>
                <p className="text-sm text-[#94a3b8] mt-0.5">
                  {t("profile.notificationPrefsDesc", { defaultValue: "Choose how NepalSewa keeps you updated" })}
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
                          {t("profile.emailNotifTitle")}
                        </p>
                        <p className="text-xs text-[#64748b] mt-1 leading-relaxed max-w-md">
                          {t("profile.emailNotifDesc")}
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
                        t("profile.saving")
                      ) : emailNotif ? (
                        <>
                          <CheckCircle size={12} />
                          {t("profile.emailNotifOn")}
                        </>
                      ) : (
                        t("profile.emailNotifOff")
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Language preferences */}
            <div
              className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm
              overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="px-6 py-5 border-b border-[#f1f5f9]">
                <h3 className="text-lg font-bold text-[#0f172a]">
                  {t("profile.languagePrefs")}
                </h3>
                <p className="text-sm text-[#94a3b8] mt-0.5">
                  {t("profile.languageDesc")}
                </p>
              </div>

              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]
                    flex items-center justify-center shrink-0">
                    <Languages size={16} className="text-[#64748b]" />
                  </div>
                  <p className="text-xs text-[#64748b] leading-relaxed flex-1">
                    {t("profile.languageDesc")}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      disabled={langSaving}
                      className={`flex items-center justify-between gap-2 px-4 py-3
                        rounded-xl border-2 transition-all disabled:opacity-60 cursor-pointer
                        ${i18n.language === lang.code
                          ? "border-[#16a34a] bg-[#f0fdf4]"
                          : "border-[#e2e8f0] hover:border-[#cbd5e1]"
                        }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-[#0f172a]">
                        <span>{lang.flag}</span>{lang.label}
                      </span>
                      {i18n.language === lang.code && <Check size={16} className="text-[#16a34a]" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick links — HomePage category-card style */}
            <div
              className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm
              overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="px-6 py-5 border-b border-[#f1f5f9]">
                <h3 className="text-lg font-bold text-[#0f172a]">
                  {t("profile.quickLinks")}
                </h3>
                <p className="text-sm text-[#94a3b8] mt-0.5">
                  {i18n.language === "ne" ? "आफ्नो रिपोर्ट र सुविधाहरूमा जानुहोस्" : "Jump to your reports and tools"}
                </p>
              </div>

              <div className="p-6 grid sm:grid-cols-2 gap-4">
                {quickLinks.map(({ to, onClick, icon: Icon, label, sub, color, bg, badge }) => {
                  const cardContent = (
                    <>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                        group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: bg }}
                      >
                        <Icon size={18} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-[#0f172a]">
                              {label}
                            </p>
                            {badge && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 shrink-0 animate-pulse">
                                {badge}
                              </span>
                            )}
                          </div>
                          <ChevronRight
                            size={14}
                            className="text-[#cbd5e1] group-hover:text-[#16a34a]
                            transition-colors shrink-0"
                          />
                        </div>
                        <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed text-left">
                          {sub}
                        </p>
                      </div>
                    </>
                  );

                  if (onClick) {
                    return (
                      <button
                        key={label}
                        onClick={onClick}
                        className="rounded-2xl p-5 border border-[#e2e8f0] flex items-start
                          gap-4 hover:shadow-md hover:border-[#cbd5e1] hover:-translate-y-0.5
                          transition-all duration-200 group w-full text-left cursor-pointer bg-white"
                      >
                        {cardContent}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={to}
                      to={to}
                      className="rounded-2xl p-5 border border-[#e2e8f0] flex items-start
                        gap-4 hover:shadow-md hover:border-[#cbd5e1] hover:-translate-y-0.5
                        transition-all duration-200 group bg-white"
                    >
                      {cardContent}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
