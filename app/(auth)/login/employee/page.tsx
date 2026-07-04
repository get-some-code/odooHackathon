"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Users, Eye, EyeOff, Lock, Mail, Loader2, ArrowRight, ChevronLeft, KeyRound } from "lucide-react";
import { LoginSchema, type LoginInput } from "@/lib/validators";
import { requestLoginOtpAction, verifyLoginOtpAction } from "@/actions/auth";

export default function EmployeeLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  
  // Two-step auth state
  const [step, setStep] = useState<"CREDENTIALS" | "OTP">("CREDENTIALS");
  const [emailInput, setEmailInput] = useState("");
  const [otpVal, setOtpVal] = useState("");

  const callbackUrl = searchParams.get("callbackUrl") || "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmitCredentials = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);
    setInfoMessage(null);
    try {
      const response = await requestLoginOtpAction(data, "EMPLOYEE");
      if (response.success && response.data?.otpSent) {
        setEmailInput(data.email);
        setStep("OTP");
        setInfoMessage("We have sent a verification code to your email. Check your server console log!");
      } else {
        setError(response.error || "Invalid email or password");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpVal.length !== 6) {
      setError("Please enter a valid 6-digit OTP code");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await verifyLoginOtpAction(emailInput, otpVal);
      if (response.success && response.data) {
        const targetUrl = callbackUrl || "/dashboard";
        router.push(targetUrl);
        router.refresh();
      } else {
        setError(response.error || "Invalid or expired OTP");
      }
    } catch {
      setError("Failed to verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 text-slate-100 font-sans px-4">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-950/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Back Button */}
        <button
          onClick={() => {
            if (step === "OTP") {
              setStep("CREDENTIALS");
              setError(null);
              setInfoMessage(null);
              setOtpVal("");
            } else {
              router.push("/login");
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 font-medium mb-6 transition-colors group"
        >
          <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          {step === "OTP" ? "Back to credentials" : "Back to portal selection"}
        </button>

        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-4 border border-indigo-400/20">
            <Users className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Employee Login
          </h1>
          <p className="text-sm text-slate-400 mt-2 font-medium">
            {step === "CREDENTIALS" ? "Sign in to access your workspace" : "Enter your email verification code"}
          </p>
        </div>

        {/* Glass Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite] pointer-events-none" />

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm font-medium flex items-start gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-sm font-medium flex items-start gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0 animate-pulse" />
              <span>{infoMessage}</span>
            </div>
          )}

          {step === "CREDENTIALS" ? (
            <form onSubmit={handleSubmit(onSubmitCredentials)} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="emp-email" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Email Address
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    id="emp-email"
                    type="email"
                    placeholder="name@company.com"
                    disabled={isLoading}
                    {...register("email")}
                    className={`w-full rounded-xl bg-slate-950/40 border ${
                      errors.email ? "border-rose-500/50 focus:border-rose-500" : "border-white/10 focus:border-indigo-500"
                    } py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:ring-2 ${
                      errors.email ? "focus:ring-rose-500/20" : "focus:ring-indigo-500/20"
                    }`}
                  />
                </div>
                {errors.email && <p className="text-xs text-rose-400 font-medium">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="emp-password" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Password
                  </label>
                </div>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="emp-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    disabled={isLoading}
                    {...register("password")}
                    className={`w-full rounded-xl bg-slate-950/40 border ${
                      errors.password ? "border-rose-500/50 focus:border-rose-500" : "border-white/10 focus:border-indigo-500"
                    } py-3 pl-11 pr-12 text-sm text-white placeholder-slate-500 outline-none transition-all focus:ring-2 ${
                      errors.password ? "focus:ring-rose-500/20" : "focus:ring-indigo-500/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-rose-400 font-medium">{errors.password.message}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none hover:shadow-indigo-600/30 group"
              >
                <div className="flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </div>
              </button>
            </form>
          ) : (
            <form onSubmit={onSubmitOtp} className="space-y-6">
              {/* OTP */}
              <div className="space-y-2">
                <label htmlFor="otp-input" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Enter 6-Digit OTP
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <KeyRound className="h-4 w-4" />
                  </span>
                  <input
                    id="otp-input"
                    type="text"
                    pattern="\d{6}"
                    maxLength={6}
                    placeholder="123456"
                    required
                    disabled={isLoading}
                    value={otpVal}
                    onChange={(e) => setOtpVal(e.target.value.replace(/\D/g, ""))}
                    className="w-full rounded-xl bg-slate-950/40 border border-white/10 focus:border-indigo-500 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 tracking-widest font-mono text-center outline-none transition-all focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none hover:shadow-indigo-600/30 group"
              >
                <div className="flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Login</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </div>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-400 mt-6 font-medium">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
