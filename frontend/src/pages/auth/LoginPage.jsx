import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, AlertCircle, Loader2, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";

// Nepal map SVG decoration — from Figma AuthLayout
function NepalMapSVG() {
  return (
    <svg
      viewBox="0 0 480 160"
      fill="none"
      className="absolute bottom-0 left-0 w-full"
      aria-hidden="true"
    >
      <path
        d="M 8,148 L 8,100 L 28,86 L 52,74 L 76,64 L 98,56 L 118,48 L 138,40 L 156,32
           L 174,24 L 192,18 L 210,12 L 230,20 L 248,12 L 266,18 L 284,10 L 302,16
           L 320,10 L 338,16 L 354,10 L 370,16 L 386,10 L 402,16 L 416,10 L 430,14
           L 444,8 L 458,12 L 470,8 L 474,16 L 474,100 L 454,108 L 432,110 L 410,114
           L 388,112 L 366,116 L 344,114 L 322,118 L 300,116 L 278,120 L 256,118
           L 234,122 L 212,120 L 190,124 L 168,122 L 146,126 L 124,124 L 102,128
           L 80,126 L 58,130 L 36,128 L 14,132 L 8,140 Z"
        stroke="white"
        strokeWidth="1.2"
        strokeOpacity="0.18"
        fill="white"
        fillOpacity="0.04"
      />
      <path
        d="M 155,32 L 172,14 L 189,32"
        stroke="white"
        strokeWidth="0.8"
        strokeOpacity="0.12"
        fill="none"
      />
      <path
        d="M 200,22 L 222,4 L 244,22"
        stroke="white"
        strokeWidth="0.8"
        strokeOpacity="0.12"
        fill="none"
      />
      <path
        d="M 270,16 L 296,0 L 322,16"
        stroke="white"
        strokeWidth="1"
        strokeOpacity="0.12"
        fill="none"
      />
    </svg>
  );
}

// Reusable input class
const INPUT_CLS =
  "w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] placeholder:text-[#94a3b8] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15 transition-all bg-white";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();


  // Track API-level error for the banner
  const [apiError, setApiError] = useState("");
  const handleSubmitWithError = async (data) => {
    setApiError("");
    try {
      await login(data);
      toast.success("Welcome back!");
      navigate("/");
    } catch (error) {
      setApiError(
        error.response?.data?.message ||
          "Invalid email or password. Please try again.",
      );
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex w-[40%] shrink-0 relative flex-col overflow-hidden"
        style={{ backgroundColor: "#15803d" }}
      >
        {/* Logo */}
        <div className="relative z-10 p-8 flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center
            backdrop-blur-sm border border-white/20 shrink-0"
          >
            <MapPin size={15} className="text-white" />
          </div>
          <span className="font-bold text-white text-[15px] tracking-tight">
            Smart<span style={{ color: "#86efac" }}>Nepal</span>
          </span>
        </div>

        {/* Centered quote */}
        <div className="relative z-10 flex-1 flex flex-col items-start justify-center px-10 py-8">
          <div className="text-[80px] leading-none font-serif text-white/10 -mb-4 select-none">
            &ldquo;
          </div>
          <div className="mb-6">
            {["Report.", "Track.", "Resolve."].map((word, i) => (
              <div
                key={word}
                className="font-bold leading-[1.1] tracking-tight"
                style={{
                  fontSize: "clamp(28px,3vw,42px)",
                  color: i === 2 ? "#86efac" : "white",
                }}
              >
                {word}
              </div>
            ))}
          </div>
          <p className="text-white/70 text-base leading-relaxed max-w-70">
            Connect your community to the change it needs. Every report makes
            Nepal better.
          </p>
          <div className="w-12 h-0.5 bg-white/20 mt-7 mb-5 rounded-full" />
          <div className="flex flex-col gap-2.5">
            {[
              "Real-time issue tracking",
              "Direct municipality contact",
              "AI-powered categorization",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#86efac] shrink-0" />
                <span className="text-white/70 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 px-10 pb-8">
          <p style={{ color: "#86efac" }} className="text-xs font-medium">
            Serving citizens across 7 provinces
          </p>
          <p className="text-white/30 text-[10px] mt-0.5">
            Bagmati · Koshi · Gandaki · Lumbini · Karnali · Madhesh ·
            Sudurpashchim
          </p>
        </div>

        <NepalMapSVG />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 bg-white flex flex-col">
        {/* Mobile logo */}
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

        <div className="flex-1 flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-100">
            <div className="mb-6">
              <h2 className="text-[26px] font-bold text-[#0f172a] tracking-tight">
                Welcome back
              </h2>
              <p className="text-sm text-[#64748b] mt-1.5">
                Sign in to your SmartNepal account
              </p>
            </div>

            {/* API error banner */}
            {apiError && (
              <div className="flex items-start gap-3 p-3.5 mb-5 rounded-lg bg-red-50 border-l-4 border-red-500">
                <AlertCircle
                  size={16}
                  className="text-red-500 shrink-0 mt-0.5"
                />
                <p className="text-sm text-red-700 leading-snug">{apiError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(handleSubmitWithError)} noValidate>
              {/* Email */}
              <div className="mb-4">
                <label
                  className="block text-xs font-semibold text-[#475569] mb-1.5"
                  htmlFor="email"
                >
                  Email address
                </label>
                <input
                  id="email"
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

              {/* Password */}
              <div className="mb-4">
                <label
                  className="block text-xs font-semibold text-[#475569] mb-1.5"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...register("password", {
                      required: "Password is required",
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
              </div>

              {/* Forgot password */}
              <div className="flex items-center justify-end mb-5">
                <button
                  type="button"
                  className="text-sm text-[#16a34a] hover:text-[#15803d] font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white
                  font-semibold text-[15px] transition-all shadow-sm disabled:opacity-60
                  disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <p className="text-sm text-[#64748b] text-center mt-6">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-[#16a34a] hover:text-[#15803d] font-semibold transition-colors"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
