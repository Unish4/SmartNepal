import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Loader2, ChevronDown, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";

// All 7 provinces with districts — from Figma
const PROVINCES = {
  "Koshi Province": [
    "Bhojpur",
    "Dhankuta",
    "Ilam",
    "Jhapa",
    "Khotang",
    "Morang",
    "Okhaldhunga",
    "Panchthar",
    "Sankhuwasabha",
    "Solukhumbu",
    "Sunsari",
    "Taplejung",
    "Terhathum",
    "Udayapur",
  ],
  "Madhesh Province": [
    "Bara",
    "Dhanusha",
    "Mahottari",
    "Parsa",
    "Rautahat",
    "Saptari",
    "Sarlahi",
    "Siraha",
  ],
  "Bagmati Province": [
    "Bhaktapur",
    "Chitwan",
    "Dhading",
    "Dolakha",
    "Kathmandu",
    "Kavrepalanchok",
    "Lalitpur",
    "Makwanpur",
    "Nuwakot",
    "Ramechhap",
    "Rasuwa",
    "Sindhuli",
    "Sindhupalchok",
  ],
  "Gandaki Province": [
    "Baglung",
    "Gorkha",
    "Kaski",
    "Lamjung",
    "Manang",
    "Mustang",
    "Myagdi",
    "Nawalpur",
    "Parbat",
    "Syangja",
    "Tanahun",
  ],
  "Lumbini Province": [
    "Arghakhanchi",
    "Banke",
    "Bardiya",
    "Dang",
    "Gulmi",
    "Kapilvastu",
    "Nawalparasi West",
    "Palpa",
    "Pyuthan",
    "Rolpa",
    "Rukum East",
    "Rupandehi",
  ],
  "Karnali Province": [
    "Dailekh",
    "Dolpa",
    "Humla",
    "Jajarkot",
    "Jumla",
    "Kalikot",
    "Mugu",
    "Rukum West",
    "Salyan",
    "Surkhet",
  ],
  "Sudurpashchim Province": [
    "Achham",
    "Baitadi",
    "Bajhang",
    "Bajura",
    "Dadeldhura",
    "Darchula",
    "Doti",
    "Kailali",
    "Kanchanpur",
  ],
};

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
const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];

const INPUT_CLS =
  "w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] placeholder:text-[#94a3b8] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15 transition-all bg-white";
const SELECT_CLS =
  "w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15 transition-all bg-white cursor-pointer appearance-none";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerAction, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [province, setProvince] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordValue, setPasswordValue] = useState("");

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm();

  const districts = province ? (PROVINCES[province] ?? []) : [];

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPasswordValue(value);
    setPasswordStrength(getStrength(value));
  };

  const onSubmit = async (data) => {
    if (!agreed) {
      toast.error("Please accept the Terms of Service to continue.");
      return;
    }
    const payload = { ...data };
    delete payload.confirmPassword;
    delete payload.district; // district not in User model yet
    if (!payload.phone) delete payload.phone;
    if (!payload.province) delete payload.province;
    // combine first + last name
    payload.name = `${data.firstName} ${data.lastName}`.trim();
    delete payload.firstName;
    delete payload.lastName;

    try {
      await registerAction(payload);
      toast.success("Account created! Welcome to SmartNepal.");
      navigate("/");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Registration failed. Try again.",
      );
    }
  };

  // Reuse the same left panel from Login
  return (
    <div className="min-h-screen flex">
      {/* Left panel — identical to Login */}
      <div
        className="hidden lg:flex w-[40%] shrink-0 relative flex-col overflow-hidden"
        style={{ backgroundColor: "#15803d" }}
      >
        <div className="relative z-10 p-8 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center border border-white/20">
            <MapPin size={15} className="text-white" />
          </div>
          <span className="font-bold text-white text-[15px] tracking-tight">
            Smart<span style={{ color: "#86efac" }}>Nepal</span>
          </span>
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-start justify-center px-10 py-8">
          <div className="text-[80px] leading-none font-serif text-white/10 -mb-4 select-none">
            &ldquo;
          </div>
          <div className="mb-6">
            {["Join thousands", "making Nepal", "better."].map((w, i) => (
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
            Every report you make helps your municipality serve citizens better.
          </p>
        </div>
        <div className="relative z-10 px-10 pb-8">
          <p style={{ color: "#86efac" }} className="text-xs font-medium">
            Serving citizens across 7 provinces
          </p>
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
      <div className="flex-1 bg-white flex flex-col overflow-y-auto">
        <div className="lg:hidden p-5 border-b border-[#f1f5f9]">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#16a34a] flex items-center justify-center">
              <MapPin size={13} className="text-white" />
            </div>
            <span className="font-bold text-[#0f172a] text-sm">
              Smart<span className="text-[#16a34a]">Nepal</span>
            </span>
          </Link>
        </div>

        <div className="flex-1 flex items-start justify-center p-6 md:p-10 py-8">
          <div className="w-full max-w-100">
            <div className="mb-6">
              <h2 className="text-[26px] font-bold text-[#0f172a] tracking-tight">
                Create your account
              </h2>
              <p className="text-sm text-[#64748b] mt-1.5">
                Join thousands of citizens making Nepal better.
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
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                    First name
                  </label>
                  <input
                    type="text"
                    placeholder="Ramesh"
                    {...register("firstName", { required: "Required" })}
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
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                    Last name
                  </label>
                  <input
                    type="text"
                    placeholder="Sharma"
                    {...register("lastName", { required: "Required" })}
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
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email",
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
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Phone number{" "}
                  <span className="text-[#94a3b8] font-normal">(optional)</span>
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
                    type="tel"
                    placeholder="98XXXXXXXX"
                    {...register("phone")}
                    className={`${INPUT_CLS} flex-1`}
                  />
                </div>
              </div>

              {/* Province */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Province
                </label>
                <div className="relative">
                  <select
                    {...register("province")}
                    onChange={(e) => {
                      setProvince(e.target.value);
                    }}
                    className={SELECT_CLS}
                    style={{ paddingRight: "2.5rem" }}
                  >
                    <option value="">Select your province</option>
                    {Object.keys(PROVINCES).map((p) => (
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
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  District
                </label>
                <div className="relative">
                  <select
                    {...register("district")}
                    disabled={!province}
                    className={`${SELECT_CLS} ${!province ? "opacity-50 cursor-not-allowed" : ""}`}
                    style={{ paddingRight: "2.5rem" }}
                  >
                    <option value="">
                      {province
                        ? "Select your district"
                        : "Select a province first"}
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

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    {...register("password", {
                      required: "Password is required",
                      minLength: { value: 6, message: "Min. 6 characters" },
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
                        {STRENGTH_LABELS[passwordStrength]} password
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter your password"
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (v) =>
                        v === getValues("password") || "Passwords do not match",
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
                  I agree to the{" "}
                  <span className="text-[#16a34a] font-semibold cursor-pointer hover:underline">
                    Terms of Service
                  </span>{" "}
                  and{" "}
                  <span className="text-[#16a34a] font-semibold cursor-pointer hover:underline">
                    Privacy Policy
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
                    <Loader2 size={16} className="animate-spin" /> Creating
                    account…
                  </>
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            <p className="text-sm text-[#64748b] text-center mt-5">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-[#16a34a] hover:text-[#15803d] font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
