import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Loader2, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";
import { NEPAL_LOCATIONS, getDistricts, getCities } from "../../constants/nepalLocations.js";
import LanguageSwitcher from "../../components/layout/LanguageSwitcher.jsx";

// Password strength util
function getStrength(pwd) {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 6) s++;
  if (pwd.length >= 10) s++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) s++;
  return Math.min(s, 4);
}

const STRENGTH_COLORS = ["#e2e8f0", "#ef4444", "#f97316", "#eab308", "#16a34a"];

const INPUT_CLS =
  "w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] placeholder:text-[#94a3b8] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15 transition-all bg-white";
const SELECT_CLS =
  "w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15 transition-all bg-white cursor-pointer appearance-none";

export default function RegisterPage() {
  const { t, i18n } = useTranslation("auth");
  const navigate = useNavigate();
  const { register: registerAction, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordValue, setPasswordValue] = useState("");

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm();

  const districts = province ? getDistricts(province) : [];
  const cities = district ? getCities(province, district) : [];

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPasswordValue(value);
    setPasswordStrength(getStrength(value));
  };

  const onSubmit = async (data) => {
    if (!agreed) {
      toast.error(
        i18n.language === "ne"
          ? "कृपया अगाडि बढ्नको लागि सेवाका सर्तहरू स्वीकार गर्नुहोस्।"
          : "Please accept the Terms of Service to continue.",
      );
      return;
    }
    const payload = { ...data };
    delete payload.confirmPassword;
    if (!payload.phone) delete payload.phone;
    if (!payload.province) delete payload.province;
    if (!payload.district) delete payload.district;
    if (!payload.city) delete payload.city;
    // combine first + last name
    payload.name = `${data.firstName} ${data.lastName}`.trim();
    delete payload.firstName;
    delete payload.lastName;

    try {
      await registerAction(payload);
      toast.success(
        i18n.language === "ne"
          ? "खाता सिर्जना भयो! नेपाल सेवामा स्वागत छ।"
          : "Account created! Welcome to NepalSewa.",
      );
      navigate("/");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          (i18n.language === "ne"
            ? "दर्ता असफल भयो। फेरि प्रयास गर्नुहोस्।"
            : "Registration failed. Try again."),
      );
    }
  };

  const STRENGTH_LABELS = [
    "",
    t("register.strengthWeak"),
    t("register.strengthFair"),
    t("register.strengthGood"),
    t("register.strengthStrong"),
  ];

  const quoteWords =
    i18n.language === "ne"
      ? ["हजारौंसँग जोडिनुहोस्", "नेपाललाई बनाउन", "राम्रो।"]
      : ["Join thousands", "making Nepal", "better."];

  const quoteSubtitle =
    i18n.language === "ne"
      ? "तपाईंले गर्नुभएको हरेक रिपोर्टले तपाईंको नगरपालिकालाई नागरिकहरूको राम्रो सेवा गर्न मद्दत गर्दछ।"
      : "Every report you make helps your municipality serve citizens better.";

  const provincesList =
    i18n.language === "ne"
      ? "बागमती · कोशी · गण्डकी · लुम्बिनी · कर्णाली · मधेश · सुदूरपश्चिम"
      : "Bagmati · Koshi · Gandaki · Lumbini · Karnali · Madhesh · Sudurpashchim";

  return (
    <div className="min-h-screen flex">
      {/* Left panel — identical to Login */}
      <div
        className="hidden lg:flex w-[40%] shrink-0 relative flex-col overflow-hidden"
        style={{ backgroundColor: "#15803d" }}
      >
        <div className="relative z-10 p-8 flex items-center gap-2.5">
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <img src="/icon.png" alt="" className="w-full h-full rounded-lg" />
          </div>
          <Link to="/" className="font-bold text-white text-[15px] tracking-tight">
            {i18n.language === "ne" ? (
              <>
                नेपाल<span style={{ color: "#86efac" }}> सेवा</span>
              </>
            ) : (
              <>
                Nepal<span style={{ color: "#86efac" }}>Sewa</span>
              </>
            )}
          </Link>
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-start justify-start pt-20 px-10 py-8">
          <div className="text-[80px] leading-none font-serif text-white/10 -mb-4 select-none">
            &ldquo;
          </div>
          <div className="mb-6">
            {quoteWords.map((w, i) => (
              <div
                key={w}
                className="font-bold leading-[1.1] tracking-tight"
                style={{
                  fontSize: "clamp(28px,3vw,38px)",
                  color: i === 2 ? "#86efac" : "white",
                }}
              >
                {w}
              </div>
            ))}
          </div>
          <p className="text-white/70 text-base leading-relaxed max-w-70">
            {quoteSubtitle}
          </p>
        </div>
        <div className="relative z-10 px-10 pb-8">
          <p style={{ color: "#86efac" }} className="text-xs font-medium">
            {t("login.provincesFooter")}
          </p>
          <p className="text-white/30 text-[10px] mt-0.5">{provincesList}</p>
        </div>
        <svg
          viewBox="0 0 480 160"
          fill="none"
          className="absolute bottom-0 left-0 w-full"
          aria-hidden="true"
        >
          <path
            d="M 8,148 L 8,100 L 28,86 L 52,74 L 76,64 L 98,56 L 118,48 L 138,40 L 156,32 L 174,24 L 192,18 L 210,12 L 230,20 L 248,12 L 266,18 L 284,10 L 302,16 L 320,10 L 338,16 L 354,10 L 370,16 L 386,10 L 402,16 L 416,10 L 430,14 L 444,8 L 458,12 L 470,8 L 474,16 L 474,100 L 454,108 L 432,110 L 410,114 L 388,112 L 366,116 L 344,114 L 322,118 L 300,116 L 278,120 L 256,118 L 234,122 L 212,120 L 190,124 L 168,122 L 146,126 L 124,124 L 102,128 L 80,126 L 58,130 L 36,128 L 14,132 L 8,140 Z"
            stroke="white"
            strokeWidth="1.2"
            strokeOpacity="0.18"
            fill="white"
            fillOpacity="0.04"
          />
        </svg>
      </div>

      {/* Right form panel */}
      <div className="flex-1 bg-white flex flex-col overflow-y-auto relative">
        {/* Language switcher */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-10">
          <LanguageSwitcher />
        </div>

        <div className="lg:hidden p-5 border-b border-[#f1f5f9]">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-7 h-7 flex items-center justify-center shrink-0">
              <img src="/icon.png" alt="" className="w-full h-full rounded-lg" />
            </div>
            <span className="font-bold text-[#0f172a] text-sm">
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
        </div>

        <div className="flex-1 flex items-start justify-center p-6 md:p-10 py-8">
          <div className="w-full max-w-100">
            <div className="mb-6">
              <h2 className="text-[26px] font-bold text-[#0f172a] tracking-tight">
                {t("register.title")}
              </h2>
              <p className="text-sm text-[#64748b] mt-1.5">
                {t("register.subtitle")}
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-4"
            >
              {/* First + Last name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-xs font-semibold text-[#475569] mb-1.5">
                    {t("register.firstName")}
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    placeholder={i18n.language === "ne" ? "पहिलो नाम" : "First name"}
                    {...register("firstName", {
                      required: i18n.language === "ne" ? "आवश्यक छ" : "Required",
                    })}
                    className={
                      errors.firstName
                        ? INPUT_CLS.replace(
                            "border-[#e2e8f0]",
                            "border-red-300",
                          )
                        : INPUT_CLS
                    }
                  />
                  {errors.firstName && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-xs font-semibold text-[#475569] mb-1.5">
                    {t("register.lastName")}
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    placeholder={i18n.language === "ne" ? "थर" : "Last name"}
                    {...register("lastName", {
                      required: i18n.language === "ne" ? "आवश्यक छ" : "Required",
                    })}
                    className={
                      errors.lastName
                        ? INPUT_CLS.replace(
                            "border-[#e2e8f0]",
                            "border-red-300",
                          )
                        : INPUT_CLS
                    }
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-[#475569] mb-1.5">
                  {t("register.email")}
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder={i18n.language === "ne" ? "इमेल ठेगाना" : "Email address"}
                  {...register("email", {
                    required:
                      i18n.language === "ne"
                        ? "इमेल आवश्यक छ"
                        : "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message:
                        i18n.language === "ne"
                          ? "मान्य इमेल लेख्नुहोस्"
                          : "Enter a valid email",
                    },
                  })}
                  className={
                    errors.email
                      ? INPUT_CLS.replace("border-[#e2e8f0]", "border-red-300")
                      : INPUT_CLS
                  }
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-[#475569] mb-1.5">
                  {t("register.phone")}{" "}
                  <span className="text-[#94a3b8] font-normal">
                    {t("register.phoneOptional")}
                  </span>
                </label>
                <div className="flex gap-2">
                  <div
                    className="h-10 px-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc]
                    flex items-center gap-1.5 shrink-0 select-none"
                  >
                    <span className="text-sm leading-none">🇳🇵</span>
                    <span className="text-sm text-[#475569] font-medium">
                      +977
                    </span>
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="98XXXXXXXX"
                    {...register("phone")}
                    className={`${INPUT_CLS} flex-1`}
                  />
                </div>
              </div>

              {/* Province */}
              <div>
                <label htmlFor="province" className="block text-xs font-semibold text-[#475569] mb-1.5">
                  {t("register.province")}
                </label>
                <div className="relative">
                  <select
                    id="province"
                    {...register("province")}
                    onChange={(e) => {
                      setProvince(e.target.value);
                      setDistrict("");
                    }}
                    className={SELECT_CLS}
                    style={{ paddingRight: "2.5rem" }}
                  >
                    <option value="">{t("register.provincePlaceholder")}</option>
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

              {/* District */}
              <div>
                <label htmlFor="district" className="block text-xs font-semibold text-[#475569] mb-1.5">
                  {t("register.district")}
                </label>
                <div className="relative">
                  <select
                    id="district"
                    {...register("district")}
                    disabled={!province}
                    onChange={(e) => setDistrict(e.target.value)}
                    className={`${SELECT_CLS} ${!province ? "opacity-50 cursor-not-allowed" : ""}`}
                    style={{ paddingRight: "2.5rem" }}
                  >
                    <option value="">
                      {province
                        ? t("register.districtPlaceholder")
                        : t("register.districtPlaceholderNoProvince")}
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

              {/* City */}
              <div>
                <label htmlFor="city" className="block text-xs font-semibold text-[#475569] mb-1.5">
                  {t("register.city")}
                </label>
                <div className="relative">
                  <select
                    id="city"
                    {...register("city")}
                    disabled={!district}
                    className={`${SELECT_CLS} ${!district ? "opacity-50 cursor-not-allowed" : ""}`}
                    style={{ paddingRight: "2.5rem" }}
                  >
                    <option value="">
                      {district
                        ? t("register.cityPlaceholder")
                        : t("register.cityPlaceholderNoDistrict")}
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

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-[#475569] mb-1.5">
                  {t("register.password")}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("register.passwordPlaceholder")}
                    {...register("password", {
                      required:
                        i18n.language === "ne"
                          ? "पासवर्ड आवश्यक छ"
                          : "Password is required",
                      minLength: {
                        value: 6,
                        message:
                          i18n.language === "ne"
                            ? "कमतीमा ६ अक्षर हुनुपर्छ"
                            : "Min. 6 characters",
                      },
                      onChange: handlePasswordChange,
                    })}
                    className={`${errors.password ? INPUT_CLS.replace("border-[#e2e8f0]", "border-red-300") : INPUT_CLS} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569] transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.password.message}
                  </p>
                )}
                {/* Strength bar */}
                {passwordValue && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((seg) => (
                        <div
                          key={seg}
                          className="h-1 flex-1 rounded-full transition-colors duration-300"
                          style={{
                            backgroundColor:
                              passwordStrength >= seg
                                ? STRENGTH_COLORS[passwordStrength]
                                : "#e2e8f0",
                          }}
                        />
                      ))}
                    </div>
                    {passwordStrength > 0 && (
                      <p
                        className="text-xs font-medium"
                        style={{ color: STRENGTH_COLORS[passwordStrength] }}
                      >
                        {STRENGTH_LABELS[passwordStrength]}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-[#475569] mb-1.5">
                  {t("register.confirmPassword")}
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder={t("register.confirmPasswordPlaceholder")}
                    {...register("confirmPassword", {
                      required:
                        i18n.language === "ne"
                          ? "कृपया आफ्नो पासवर्ड पुष्टि गर्नुहोस्"
                          : "Please confirm your password",
                      validate: (v) =>
                        v === getValues("password") ||
                        t("register.passwordMismatch"),
                    })}
                    className={`${errors.confirmPassword ? INPUT_CLS.replace("border-[#e2e8f0]", "border-red-300") : INPUT_CLS} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569] transition-colors"
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className="w-4 h-4 rounded border-2 transition-all flex items-center justify-center"
                    style={{
                      borderColor: agreed ? "#16a34a" : "#cbd5e1",
                      backgroundColor: agreed ? "#16a34a" : "white",
                    }}
                  >
                    {agreed && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path
                          d="M1 3.5L3.5 6L8 1"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-[#475569] leading-relaxed">
                  {t("register.termsAgree")}{" "}
                  <span className="text-[#16a34a] font-semibold cursor-pointer hover:underline">
                    {t("register.termsOfService")}
                  </span>{" "}
                  {t("register.and")}{" "}
                  <span className="text-[#16a34a] font-semibold cursor-pointer hover:underline">
                    {t("register.privacyPolicy")}
                  </span>
                </span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white
                  font-semibold text-[15px] transition-all shadow-sm disabled:opacity-60
                  disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> {t("register.submitting")}
                  </>
                ) : (
                  t("register.submitButton")
                )}
              </button>
            </form>

            <p className="text-sm text-[#64748b] text-center mt-5">
              {t("register.haveAccount")}{" "}
              <Link
                to="/login"
                className="text-[#16a34a] hover:text-[#15803d] font-semibold transition-colors"
              >
                {t("register.signIn")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
