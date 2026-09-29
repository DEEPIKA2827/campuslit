/**
 * @file app/register/page.tsx
 * @description Student Registration Page for CampusLit.
 * @purpose Registers a new student account, connects to useAuth().register(), and redirects to /onboarding questionnaire.
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Loader2,
  ShieldCheck
} from "lucide-react";

export default function RegisterPage() {
  const { register, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/onboarding");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim()) {
      setError("Please enter your first name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setIsSubmitting(true);

    const result = await register(
      email.trim(),
      password,
      firstName.trim(),
      lastName.trim() || undefined
    );

    if (!result.success) {
      setError(result.error || "Registration failed. Please check your information.");
      setIsSubmitting(false);
      return;
    }

    // On successful registration, redirect to onboarding questionnaire
    router.push("/onboarding");
  };

  return (
    <main className="min-h-screen bg-[#08090e] text-[#f3f4f6] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-purple-500/30 selection:text-purple-200">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[450px] bg-radial-glow opacity-80" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 font-bold text-white shadow-lg shadow-purple-500/30 group-hover:scale-105 transition-transform">
              CO
            </div>
            <span className="text-xl font-bold tracking-tight text-white">CampusLit</span>
          </Link>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300 border border-purple-500/20">
              <Sparkles className="size-3 text-purple-400" />
              <span>Join 10,000+ Karnataka Engineers</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Create your account
            </h1>
            <p className="text-xs sm:text-sm text-gray-400">
              Set up your student profile and launch Mission Control
            </p>
          </div>
        </div>

        {/* Register Form Container */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-[#0d0f18]/90 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-5">
          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 animate-in fade-in">
              <AlertCircle className="size-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields (2 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-300">First Name</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <User className="size-4" />
                  </div>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Deepika"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-9 pr-3 text-xs text-white placeholder-gray-500 focus:border-purple-500 focus:bg-white/[0.06] focus:outline-none transition"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-300">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="R"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 px-3 text-xs text-white placeholder-gray-500 focus:border-purple-500 focus:bg-white/[0.06] focus:outline-none transition"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-300">Email Address</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Mail className="size-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@college.edu.in"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-9 pr-3 text-xs text-white placeholder-gray-500 focus:border-purple-500 focus:bg-white/[0.06] focus:outline-none transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-300">Password (min. 6 characters)</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Lock className="size-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-9 pr-3 text-xs text-white placeholder-gray-500 focus:border-purple-500 focus:bg-white/[0.06] focus:outline-none transition"
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-300">Confirm Password</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Lock className="size-4" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-9 pr-3 text-xs text-white placeholder-gray-500 focus:border-purple-500 focus:bg-white/[0.06] focus:outline-none transition"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-sm font-bold text-white shadow-lg shadow-purple-600/30 hover:from-purple-500 hover:to-indigo-500 active:scale-98 transition cursor-pointer disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Setup Profile</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="pt-2 text-center text-xs text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-purple-400 hover:text-purple-300 transition">
              Sign in instead
            </Link>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="size-4 text-emerald-400" />
          <span>Zero Spam • Privacy First • 100% Free for Karnataka Engineering Students</span>
        </div>
      </div>
    </main>
  );
}
