import Link from "next/link";
import { Users, Shield, ArrowRight, Building2 } from "lucide-react";

export default function LoginSelectorPage() {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 text-slate-100 font-sans px-4">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-violet-900/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-5 border border-indigo-400/20">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            HR Management System
          </h1>
          <p className="text-sm text-slate-400 mt-2.5 font-medium max-w-xs">
            Select your portal to continue
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Employee Card */}
          <Link
            href="/login/employee"
            id="employee-login-btn"
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur-xl shadow-xl hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all duration-200 hover:-translate-y-1 active:translate-y-0 flex flex-col gap-4"
          >
            {/* Shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/4 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />

            <div className="h-12 w-12 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-indigo-400" />
            </div>

            <div className="flex-1">
              <h2 className="text-base font-bold text-white mb-1">Employee Login</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Access your dashboard, attendance, leave requests, and payslips.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors">
              Continue as Employee
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>

          {/* Admin / HR Card */}
          <Link
            href="/login/admin"
            id="admin-login-btn"
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur-xl shadow-xl hover:border-violet-500/40 hover:bg-violet-500/5 transition-all duration-200 hover:-translate-y-1 active:translate-y-0 flex flex-col gap-4"
          >
            {/* Shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/4 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />

            <div className="h-12 w-12 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-violet-400" />
            </div>

            <div className="flex-1">
              <h2 className="text-base font-bold text-white mb-1">Admin / HR Login</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Manage workforce, payroll, approvals, reports, and system settings.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 group-hover:text-violet-300 transition-colors">
              Continue as Admin
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-8">
          New employee?{" "}
          <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            Register your account
          </Link>
        </p>
      </div>
    </div>
  );
}
