import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff, User, MapPin } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";

const PROVINCES = [
  "Koshi Province",
  "Madhesh Province",
  "Bagmati Province",
  "Gandaki Province",
  "Lumbini Province",
  "Karnali Province",
  "Sudurpashchim Province",
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerAction, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    const payload = { ...data };
    delete payload.confirmPassword;

    // Strip empty optional fields — don't send empty strings to MongoDB.
    if (!payload.phone) delete payload.phone;
    if (!payload.province) delete payload.province;

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

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-green-700 flex-col justify-between p-12">
        <div className="flex items-center gap-2 text-white">
          <MapPin size={22} />
          <span className="text-xl font-semibold">SmartNepal</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-snug">
            Join thousands
            <br />
            making Nepal
            <br />
            better.
          </h2>
          <p className="text-green-300 mt-3 text-sm">
            Serving citizens across all 7 provinces.
          </p>
        </div>
        <p className="text-green-400 text-xs">
          © {new Date().getFullYear()} SmartNepal
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile-only logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <MapPin size={20} className="text-green-600" />
            <span className="font-semibold text-gray-900">SmartNepal</span>
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Create your account
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            Report civic issues in your community
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full name
              </label>
              <div className="relative">
                <User
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Enter your name"
                  {...register("name", {
                    required: "Full name is required",
                    minLength: {
                      value: 2,
                      message: "Name must be at least 2 characters",
                    },
                  })}
                  className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border outline-none transition-all
                    ${
                      errors.name
                        ? "border-red-400 bg-red-50/30"
                        : "border-gray-200 focus:border-green-500 focus:bg-green-50/20"
                    }`}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
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
                  placeholder="Enter your email"
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
                        ? "border-red-400 bg-red-50/30"
                        : "border-gray-200 focus:border-green-500 focus:bg-green-50/20"
                    }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone — optional, no icon import needed beyond what's already imported */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 select-none">
                  +977
                </span>
                <input
                  type="tel"
                  placeholder="98XXXXXXXX"
                  {...register("phone")}
                  className="w-full pl-14 pr-4 py-2.5 text-sm rounded-lg border border-gray-200
                    outline-none focus:border-green-500 focus:bg-green-50/20 transition-all"
                />
              </div>
            </div>

            {/* Province — optional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Province{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select
                {...register("province")}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white
                  text-gray-700 outline-none focus:border-green-500 focus:bg-green-50/20 transition-all"
              >
                <option value="">Select your province</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Password */}
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
                  placeholder="Min. 6 characters"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
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

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="password"
                  placeholder="Re-enter your password"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value) =>
                      value === getValues("password") ||
                      "Passwords do not match",
                  })}
                  className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border outline-none transition-all
                    ${
                      errors.confirmPassword
                        ? "border-red-400 bg-red-50/30"
                        : "border-gray-200 focus:border-green-500 focus:bg-green-50/20"
                    }`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg
                hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {isLoading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-green-600 hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
