/**
 * @file components/layout/navbar.tsx
 * @description Dynamic Top Navigation Bar Component for CampusLit.
 * @purpose Renders navigation links, branding, and live authentication actions (Sign In / Register or User Avatar / Logout).
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import {
  Sparkles,
  Search,
  LogOut,
  User,
  Compass,
  Briefcase,
  GraduationCap,
  MessageSquare,
  ChevronDown,
  Menu,
  X
} from "lucide-react";

export function Navbar() {
  const { user, profile, isAuthenticated, isLoading, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const displayName = profile?.firstName || user?.email?.split("@")[0] || "Student";
  const userInitials = profile?.firstName
    ? `${profile.firstName[0]}${profile.lastName ? profile.lastName[0] : ""}`.toUpperCase()
    : "ST";

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#08090e]/80 border-b border-white/10">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 font-bold text-white shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform">
            CL
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              CampusLit
              <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-400 border border-purple-500/20">
                Karnataka 2025/26
              </span>
            </span>
          </div>
        </Link>

        {/* Navigation Links (Desktop) */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-400 md:flex">
          <Link href="/roadmap" className="transition hover:text-white flex items-center gap-1.5">
            <Compass className="size-4 text-purple-400" />
            <span>Roadmap</span>
          </Link>
          <Link href="/opportunities" className="transition hover:text-white flex items-center gap-1.5">
            <Briefcase className="size-4 text-blue-400" />
            <span>Opportunities</span>
          </Link>
          <Link href="/scholarships" className="transition hover:text-white flex items-center gap-1.5">
            <GraduationCap className="size-4 text-emerald-400" />
            <span>Scholarships</span>
          </Link>
          <Link href="/onboarding" className="transition text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1">
            <Sparkles className="size-3.5" />
            <span>Onboarding</span>
          </Link>
        </nav>

        {/* Authentication Actions & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <Link
            href="/roadmap"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-400 border border-white/10 bg-white/[0.03] px-3 py-1.5 rounded-lg hover:border-white/20 transition"
          >
            <Search className="size-3.5" />
            <span>⌘K Quick Search</span>
          </Link>

          {isLoading ? (
            <div className="size-8 rounded-full bg-white/5 animate-pulse" />
          ) : isAuthenticated ? (
            /* Logged-In User Badge & Dropdown */
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-1.5 pr-3 hover:bg-white/[0.08] transition cursor-pointer"
              >
                <div className="size-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 font-bold text-white text-xs flex items-center justify-center shadow-sm">
                  {userInitials}
                </div>
                <span className="text-xs font-semibold text-gray-200 hidden sm:inline-block">
                  {displayName}
                </span>
                <ChevronDown className="size-3 text-gray-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-[#0d0f18] p-1.5 shadow-xl backdrop-blur-xl z-50 space-y-1 animate-in fade-in slide-in-from-top-1">
                  <div className="px-3 py-2 border-b border-white/10">
                    <span className="text-xs font-bold text-white block truncate">{displayName}</span>
                    <span className="text-[10px] text-gray-400 block truncate">
                      {user?.email || "Authenticated Student"}
                    </span>
                  </div>
                  <Link
                    href="/onboarding"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition"
                  >
                    <User className="size-3.5 text-purple-400" />
                    <span>Update Profile</span>
                  </Link>
                  <button
                    onClick={async () => {
                      setDropdownOpen(false);
                      await logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition cursor-pointer text-left"
                  >
                    <LogOut className="size-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Unauthenticated Buttons */
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-gray-300 transition hover:bg-white/[0.08] hover:text-white"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-purple-600/30 transition hover:from-purple-500 hover:to-indigo-500 active:scale-95"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="flex items-center justify-center size-9 rounded-xl border border-white/10 bg-white/[0.04] text-gray-300 hover:text-white md:hidden cursor-pointer"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-[#0b0d16] px-4 py-4 md:hidden animate-in fade-in slide-in-from-top-2 space-y-3">
          <nav className="flex flex-col gap-2">
            <Link
              href="/roadmap"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm font-medium text-gray-200 hover:bg-white/[0.08] transition"
            >
              <Compass className="size-4 text-purple-400" />
              <span>Interactive Roadmap</span>
            </Link>
            <Link
              href="/opportunities"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm font-medium text-gray-200 hover:bg-white/[0.08] transition"
            >
              <Briefcase className="size-4 text-blue-400" />
              <span>Opportunities & Internships</span>
            </Link>
            <Link
              href="/scholarships"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm font-medium text-gray-200 hover:bg-white/[0.08] transition"
            >
              <GraduationCap className="size-4 text-emerald-400" />
              <span>Scholarships & Grants</span>
            </Link>
            <Link
              href="/ai-mentor"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm font-medium text-gray-200 hover:bg-white/[0.08] transition"
            >
              <MessageSquare className="size-4 text-cyan-400" />
              <span>AI Senior Mentor</span>
            </Link>
            <Link
              href="/onboarding"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-sm font-semibold text-purple-300 hover:bg-purple-500/20 transition"
            >
              <Sparkles className="size-4 text-purple-400" />
              <span>Quick Onboarding Setup</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
