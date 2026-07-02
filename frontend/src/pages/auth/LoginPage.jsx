import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff, MapPin } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await login(data);
      toast.success("Welcome back!");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left decorative panel — hidden on mobile ── */}
      <div className="hidden lg:flex lg:w-2/5 bg-green-700 flex-col justify-between p-12">
        <div className="flex items-center gap-2 text-white">
          <MapPin size={22} />
          <span className="text-xl font-semibold">SmartNepal</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-snug">
            Report. Track.
            <br />
            Resolve.
          </h2>
          <p className="text-green-300 mt-3 text-sm">
            Serving citizens across all 7 provinces of Nepal.
          </p>
        </div>
        <p className="text-green-400 text-xs">
          © {new Date().getFullYear()} SmartNepal
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <MapPin size={20} className="text-green-600" />
            <span className="font-semibold text-gray-900">SmartNepal</span>
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Welcome back
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            Sign in to your SmartNepal account
          </p>

          {/* RHF form — handleSubmit runs validation, then calls onSubmit */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            {/* Email field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  placeholder="you@example.com"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email address",
                    },
                  })}
                  className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border outline-none transition-all
                    ${
                      errors.email
                        ? "border-red-400 bg-red-50/30 focus:border-red-500"
                        : "border-gray-200 focus:border-green-500 focus:bg-green-50/20"
                    }`}
                />
              </div>
              {/* Inline error — shown only after the user interacts with the field */}
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password", {
                    required: "Password is required",
                  })}
                  className={`w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border outline-none transition-all
                    ${
                      errors.password
                        ? "border-red-400 bg-red-50/30"
                        : "border-gray-200 focus:border-green-500 focus:bg-green-50/20"
                    }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

            {/* Submit button — disabled and shows text feedback while loading */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg
                hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-6">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-green-600 hover:underline font-medium"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
