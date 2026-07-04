"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Eye, EyeOff, Lock, Mail, User as UserIcon, Award, Loader2, ArrowRight } from "lucide-react";
import { RegisterSchema, type RegisterInput } from "@/lib/validators";
import { registerAction } from "@/actions/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      employeeId: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await registerAction(data);

      if (response.success) {
        // Automatically redirects to the default EMPLOYEE dashboard
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(response.error || "Failed to register. Please check your inputs.");
        setIsLoading(false);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 text-slate-100 font-sans px-4 py-12">
      {/* Dynamic Background Glowing Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-950/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Glassmorphic Card Container */}
      <div className="w-full max-w-lg z-10">
        <div className="flex flex-col items-center mb-8">
          {/* Custom Brand Logo Shield */}
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-4 border border-indigo-400/20">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-sm text-slate-400 mt-2 font-medium">
            Register your HR profile with your Employee ID
          </p>
        </div>

        {/* The Glass Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          {/* Interactive Card Border Highlight */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite] pointer-events-none" />

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm font-medium flex items-start gap-2.5 animate-fadeIn">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Employee ID Field */}
            <div className="space-y-2">
              <label htmlFor="employeeId" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Employee ID
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <Award className="h-4.5 w-4.5" />
                </span>
                <input
                  id="employeeId"
                  type="text"
                  placeholder="EMP123"
                  disabled={isLoading}
                  {...register("employeeId")}
                  className={`w-full rounded-xl bg-slate-950/40 border ${
                    errors.employeeId ? "border-rose-500/50 focus:border-rose-500" : "border-white/10 focus:border-indigo-500"
                  } py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:ring-2 ${
                    errors.employeeId ? "focus:ring-rose-500/20" : "focus:ring-indigo-500/20"
                  }`}
                />
              </div>
              {errors.employeeId && (
                <p className="text-xs text-rose-400 font-medium">{errors.employeeId.message}</p>
              )}
            </div>

            {/* Name Fields (Two columns on desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  First Name
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <UserIcon className="h-4.5 w-4.5" />
                  </span>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    disabled={isLoading}
                    {...register("firstName")}
                    className={`w-full rounded-xl bg-slate-950/40 border ${
                      errors.firstName ? "border-rose-500/50 focus:border-rose-500" : "border-white/10 focus:border-indigo-500"
                    } py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:ring-2 ${
                      errors.firstName ? "focus:ring-rose-500/20" : "focus:ring-indigo-500/20"
                    }`}
                  />
                </div>
                {errors.firstName && (
                  <p className="text-xs text-rose-400 font-medium">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="lastName" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Last Name
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <UserIcon className="h-4.5 w-4.5" />
                  </span>
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    disabled={isLoading}
                    {...register("lastName")}
                    className={`w-full rounded-xl bg-slate-950/40 border ${
                      errors.lastName ? "border-rose-500/50 focus:border-rose-500" : "border-white/10 focus:border-indigo-500"
                    } py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:ring-2 ${
                      errors.lastName ? "focus:ring-rose-500/20" : "focus:ring-indigo-500/20"
                    }`}
                  />
                </div>
                {errors.lastName && (
                  <p className="text-xs text-rose-400 font-medium">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email Address
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="john.doe@company.com"
                  disabled={isLoading}
                  {...register("email")}
                  className={`w-full rounded-xl bg-slate-950/40 border ${
                    errors.email ? "border-rose-500/50 focus:border-rose-500" : "border-white/10 focus:border-indigo-500"
                  } py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:ring-2 ${
                    errors.email ? "focus:ring-rose-500/20" : "focus:ring-indigo-500/20"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-400 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <Lock className="h-4.5 w-4.5" />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    disabled={isLoading}
                    {...register("password")}
                    className={`w-full rounded-xl bg-slate-950/40 border ${
                      errors.password ? "border-rose-500/50 focus:border-rose-500" : "border-white/10 focus:border-indigo-500"
                    } py-3 pl-11 pr-10 text-sm text-white placeholder-slate-500 outline-none transition-all focus:ring-2 ${
                      errors.password ? "focus:ring-rose-500/20" : "focus:ring-indigo-500/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-400 font-medium leading-tight">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Confirm Password
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <Lock className="h-4.5 w-4.5" />
                  </span>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    disabled={isLoading}
                    {...register("confirmPassword")}
                    className={`w-full rounded-xl bg-slate-950/40 border ${
                      errors.confirmPassword ? "border-rose-500/50 focus:border-rose-500" : "border-white/10 focus:border-indigo-500"
                    } py-3 pl-11 pr-10 text-sm text-white placeholder-slate-500 outline-none transition-all focus:ring-2 ${
                      errors.confirmPassword ? "focus:ring-rose-500/20" : "focus:ring-indigo-500/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-rose-400 font-medium leading-tight">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none hover:shadow-indigo-600/30 group mt-2"
            >
              <div className="flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Profile</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </div>
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-sm text-slate-400 mt-6 font-medium">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
