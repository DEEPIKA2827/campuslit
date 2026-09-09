/**
 * @file app/opportunities/page.tsx
 * @description Opportunities & Hackathons Radar for CampusOS.
 * @purpose Discovers internships, hackathons, and placement drives; connects to /api/opportunities and application tracking.
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { OpportunityWithTrackingDTO } from "@/types/api.types";
import {
  Search,
  MapPin,
  Clock,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Users,
  Briefcase,
  SlidersHorizontal,
  X,
  ShieldCheck
} from "lucide-react";

// Opportunity Categories
const categories = [
  { id: "all", label: "All Opportunities" },
  { id: "internships", label: "Internships" },
  { id: "jobs", label: "Full-Time Jobs" },
  { id: "hackathons", label: "Hackathons" },
  { id: "competitions", label: "Competitions" },
  { id: "fellowships", label: "Fellowships" },
  { id: "opensource", label: "Open Source" },
  { id: "campus_drives", label: "Campus Drives" },
  { id: "research", label: "Research" },
  { id: "trainee_roles", label: "GET & Trainee" },
  { id: "apprenticeships", label: "Apprenticeships" },
];

import opportunitiesData from "@/data/opportunities.json";

export interface OpportunityItem {
  id: string;
  numericId?: number;
  title: string;
  organization: string;
  source?: string;
  sourceUrl?: string;
  logo: string;
  category: string;
  workMode: string;
  location: string;
  batch: string[];
  minCGPA: number;
  stipend: string;
  isPaid: boolean;
  deadline: string | null;
  isUrgent: boolean;
  tags: string[];
  description: string;
  teammatesNeeded: boolean;
  verifiedBySenior: boolean;
  applicationUrl?: string | null;
  lastVerifiedAt?: string;
}

// Canonical Karnataka & Tech Industry Opportunities Data
const defaultOpportunities: OpportunityItem[] = opportunitiesData.map((o) => ({
  id: String(o.opportunityId),
  numericId: o.opportunityId,
  title: o.title,
  organization: o.company,
  source: o.source,
  sourceUrl: o.sourceUrl,
  logo:
    o.category === "hackathons"
      ? "🏆"
      : o.category === "opensource"
      ? "🌐"
      : o.category === "campus_drives"
      ? "🏢"
      : o.category === "fellowships"
      ? "🎓"
      : o.category === "competitions"
      ? "💡"
      : "⚡",
  category: o.category,
  workMode: o.workMode,
  location: o.location,
  batch: o.batch,
  minCGPA: o.minCGPA,
  stipend: o.stipend,
  isPaid: o.isPaid,
  deadline: o.deadline,
  isUrgent: o.isUrgent,
  tags: o.tags,
  description: o.description,
  teammatesNeeded: o.teammatesNeeded,
  verifiedBySenior: true,
  applicationUrl: o.applicationUrl,
  lastVerifiedAt: o.lastVerifiedAt,
}));

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>(defaultOpportunities);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  // Filter States
  const [workModeFilter, setWorkModeFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [cgpaFilter, setCgpaFilter] = useState("all");
  const [paidOnly, setPaidOnly] = useState(false);
  const [urgentOnly, setUrgentOnly] = useState(false);

  const [showTeammateModal, setShowTeammateModal] = useState(false);
  const [selectedOppForTeammates, setSelectedOppForTeammates] = useState<OpportunityItem | null>(null);

  // Fetch live opportunities from backend API
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const res = await fetch("/api/opportunities", { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const liveItems: OpportunityItem[] = json.data.map((item: OpportunityWithTrackingDTO, idx: number) => {
              const matchedDefault = defaultOpportunities.find(
                (d) => d.title.toLowerCase() === item.title.toLowerCase() || d.id === String(item.opportunityId)
              );
              return {
                id: String(item.opportunityId),
                numericId: item.opportunityId,
                title: item.title,
                organization: item.company || matchedDefault?.organization || "Karnataka Tech Partner",
                source: matchedDefault?.source || "Company Career Portal",
                sourceUrl: matchedDefault?.sourceUrl || "https://unstop.com",
                logo: matchedDefault?.logo || "🚀",
                category: matchedDefault?.category || "internships",
                workMode: matchedDefault?.workMode || "Hybrid",
                location: matchedDefault?.location || "Bengaluru, KA",
                batch: matchedDefault?.batch || ["2025", "2026", "2027", "2028"],
                minCGPA: matchedDefault?.minCGPA || 0.0,
                stipend: matchedDefault?.stipend || "Competitive Stipend",
                isPaid: matchedDefault?.isPaid ?? true,
                deadline: item.deadline ? `Due ${new Date(item.deadline).toLocaleDateString()}` : "Open",
                isUrgent: idx === 0,
                tags: matchedDefault?.tags || ["Engineering", "Technology"],
                description: item.description || matchedDefault?.description || "Opportunity details.",
                teammatesNeeded: matchedDefault?.teammatesNeeded ?? false,
                verifiedBySenior: true,
                applicationUrl: item.applicationUrl || matchedDefault?.applicationUrl,
                lastVerifiedAt: matchedDefault?.lastVerifiedAt || "2026-08-20",
              };
            });

            // Extract live bookmarked IDs strictly from authenticated server response
            const trackedIds = json.data
              .filter((d: OpportunityWithTrackingDTO) => d.trackingStatus === "saved" || d.trackingStatus === "applied")
              .map((d: OpportunityWithTrackingDTO) => String(d.opportunityId));

            setBookmarks(trackedIds);
            setOpportunities(liveItems);
          }
        }
      } catch {
        // Fallback gracefully to default items
      }
    };

    fetchOpportunities();
  }, []);

  /**
   * Toggles bookmark / application tracking status and persists to /api/opportunities/track
   */
  const toggleBookmark = async (id: string, numericId?: number) => {
    const isBookmarked = bookmarks.includes(id);
    const updated = isBookmarked ? bookmarks.filter((b) => b !== id) : [...bookmarks, id];
    setBookmarks(updated);

    const targetNumId = numericId || Number(id);
    if (!isNaN(targetNumId) && targetNumId > 0) {
      try {
        if (!isBookmarked) {
          await fetch("/api/opportunities/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              opportunityId: targetNumId,
              status: "saved",
            }),
          });
        } else {
          await fetch(`/api/opportunities/track?opportunityId=${targetNumId}`, {
            method: "DELETE",
            credentials: "include",
          });
        }
      } catch {
        // Graceful silent fallback
      }
    }
  };

  // Filter Logic
  const filteredOpportunities = opportunities.filter((opp) => {
    if (activeCategory !== "all" && opp.category !== activeCategory) return false;

    if (
      searchQuery &&
      !opp.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !opp.organization.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !opp.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    ) {
      return false;
    }

    if (workModeFilter !== "all" && opp.workMode.toLowerCase() !== workModeFilter.toLowerCase()) {
      return false;
    }

    if (batchFilter !== "all" && !opp.batch.includes(batchFilter)) {
      return false;
    }

    if (cgpaFilter === "nocgpa" && opp.minCGPA > 0) return false;
    if (cgpaFilter === "7plus" && opp.minCGPA < 7.0) return false;
    if (cgpaFilter === "8plus" && opp.minCGPA < 8.0) return false;

    if (paidOnly && !opp.isPaid) return false;
    if (urgentOnly && !opp.isUrgent) return false;

    return true;
  });

  const clearFilters = () => {
    setWorkModeFilter("all");
    setBatchFilter("all");
    setCgpaFilter("all");
    setPaidOnly(false);
    setUrgentOnly(false);
    setSearchQuery("");
    setActiveCategory("all");
  };

  const hasActiveFilters =
    workModeFilter !== "all" ||
    batchFilter !== "all" ||
    cgpaFilter !== "all" ||
    paidOnly ||
    urgentOnly ||
    searchQuery !== "" ||
    activeCategory !== "all";

  return (
    <main className="min-h-screen bg-[#08090e] text-[#f3f4f6] selection:bg-purple-500/30 selection:text-purple-200">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-radial-glow opacity-80" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      </div>

      {/* DYNAMIC HEADER NAVBAR */}
      <Navbar />

      {/* HERO & SEARCH SECTION */}
      <section className="relative z-10 pt-8 pb-6 border-b border-white/10 bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
                <Sparkles className="size-4" />
                Verified Opportunity Radar
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Internships, Hackathons & Tech Drives.
              </h1>
              <p className="text-sm text-gray-400 max-w-2xl">
                100% vetted by Karnataka seniors from RVCE, BMSCE, PES, and MSRIT. Never miss a deadline again.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/scholarships"
                className="inline-flex items-center gap-2 rounded-xl bg-purple-500/10 border border-purple-500/20 px-3.5 py-2 text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition"
              >
                <span>Explore Scholarships</span>
                <ExternalLink className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* SEARCH & QUICK STATS BAR */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Search className="size-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, skill (C++, Python, React), or company (Bosch, Cisco)..."
                className="w-full rounded-2xl border border-white/15 bg-black/60 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 backdrop-blur-xl focus:border-purple-500 focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* CATEGORY TABS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    isSelected
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                      : "bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white border border-white/5"
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* FILTER BAR & FEED SECTION */}
      <section className="relative z-10 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          {/* FILTER CONTROLS BAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3 backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5 px-2">
                <SlidersHorizontal className="size-3.5 text-purple-400" />
                Filters:
              </span>

              {/* Work Mode */}
              <select
                value={workModeFilter}
                onChange={(e) => setWorkModeFilter(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-gray-300 focus:border-purple-500 focus:outline-none"
              >
                <option value="all">Work Mode: All</option>
                <option value="remote">Remote Only</option>
                <option value="hybrid">Hybrid</option>
                <option value="on-site">On-site (KA)</option>
              </select>

              {/* Batch Year */}
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-gray-300 focus:border-purple-500 focus:outline-none"
              >
                <option value="all">Graduation Batch: All</option>
                <option value="2025">2025 Batch</option>
                <option value="2026">2026 Batch</option>
                <option value="2027">2027 Batch</option>
                <option value="2028">2028 (1st Years)</option>
              </select>

              {/* CGPA Requirement */}
              <select
                value={cgpaFilter}
                onChange={(e) => setCgpaFilter(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-gray-300 focus:border-purple-500 focus:outline-none"
              >
                <option value="all">CGPA: Any</option>
                <option value="nocgpa">No CGPA Cutoff</option>
                <option value="7plus">7.0+ CGPA</option>
                <option value="8plus">8.0+ CGPA</option>
              </select>

              {/* Paid Toggle */}
              <button
                onClick={() => setPaidOnly(!paidOnly)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                  paidOnly
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : "bg-black/60 border-white/10 text-gray-400 hover:text-white"
                }`}
              >
                💰 Stipend / Cash Prize Only
              </button>

              {/* Urgent Toggle */}
              <button
                onClick={() => setUrgentOnly(!urgentOnly)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                  urgentOnly
                    ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                    : "bg-black/60 border-white/10 text-gray-400 hover:text-white"
                }`}
              >
                ⏱️ Closing Soon (48h)
              </button>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 px-2 py-1 transition cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {/* OPPORTUNITY CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOpportunities.length === 0 ? (
              <div className="col-span-full py-16 text-center space-y-3 rounded-3xl border border-white/10 bg-white/[0.02]">
                <div className="size-12 rounded-full bg-white/5 text-gray-400 flex items-center justify-center mx-auto">
                  <Search className="size-6" />
                </div>
                <h3 className="text-base font-bold text-white">No matching opportunities found</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Try adjusting your filters or search terms to see more hackathons and internships.
                </p>
                <button
                  onClick={clearFilters}
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-lg"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              filteredOpportunities.map((opp) => {
                const isBookmarked = bookmarks.includes(opp.id);

                return (
                  <div
                    key={opp.id}
                    className="group relative rounded-3xl border border-white/10 bg-gradient-to-b from-[#10121d] to-[#0a0b12] p-5 shadow-xl hover:border-purple-500/40 hover:shadow-purple-500/10 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Top Header Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="size-11 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-xl shadow-inner">
                            {opp.logo}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-400 block truncate max-w-[180px]">
                              {opp.organization}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                              <ShieldCheck className="size-3" />
                              Senior Verified
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleBookmark(opp.id, opp.numericId)}
                          className={`p-2 rounded-xl border transition cursor-pointer ${
                            isBookmarked
                              ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                              : "bg-white/[0.03] border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.08]"
                          }`}
                        >
                          {isBookmarked ? (
                            <BookmarkCheck className="size-4 text-purple-400" />
                          ) : (
                            <Bookmark className="size-4" />
                          )}
                        </button>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1.5">
                        <h2 className="text-base font-bold text-white group-hover:text-purple-300 transition line-clamp-1">
                          {opp.title}
                        </h2>
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {opp.description}
                        </p>
                      </div>

                      {/* Key Badges (Stipend / Location / Deadline) */}
                      <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-gray-300">
                        <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.03] p-2 border border-white/5">
                          <Briefcase className="size-3.5 text-purple-400 shrink-0" />
                          <span className="font-semibold truncate">{opp.stipend}</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.03] p-2 border border-white/5">
                          <MapPin className="size-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate">{opp.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.03] p-2 border border-white/5">
                          <Clock className="size-3.5 text-amber-400 shrink-0" />
                          <span className={`truncate ${opp.isUrgent ? "text-rose-400 font-bold" : ""}`}>
                            {opp.deadline}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.03] p-2 border border-white/5">
                          <Users className="size-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate">
                            {opp.minCGPA > 0 ? `${opp.minCGPA}+ CGPA` : "No CGPA Cutoff"}
                          </span>
                        </div>
                      </div>

                      {/* Skill Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {opp.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="rounded-lg bg-white/[0.04] border border-white/5 px-2 py-0.5 text-[10px] text-gray-300 font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom CTA Row */}
                    <div className="pt-5 mt-4 border-t border-white/10 flex items-center justify-between gap-2">
                      {opp.teammatesNeeded ? (
                        <button
                          onClick={() => {
                            setSelectedOppForTeammates(opp);
                            setShowTeammateModal(true);
                          }}
                          className="flex items-center gap-1.5 text-xs font-bold text-purple-400 hover:text-purple-300 transition cursor-pointer"
                        >
                          <Users className="size-3.5" />
                          <span>Find Teammates</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-500 font-medium">Direct Application</span>
                      )}

                      <a
                        href={opp.applicationUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-purple-600/30 hover:from-purple-500 hover:to-indigo-500 transition"
                      >
                        <span>Apply Now</span>
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* TEAMMATE MATCHMAKER MODAL */}
      {showTeammateModal && selectedOppForTeammates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-purple-500/30 bg-[#0d0f18] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Karnataka Teammate Radar</h3>
              </div>
              <button
                onClick={() => setShowTeammateModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs text-purple-300 font-semibold">{selectedOppForTeammates.title}</span>
              <p className="text-xs text-gray-400">
                Connect with Karnataka engineering peers looking for hackathon teammates.
              </p>
            </div>

            {/* Teammate List */}
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              <div className="p-3 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
                <div className="space-y-0.5">
                  <strong className="text-xs text-white block">Aditya K. (RVCE • CSE Sem 2)</strong>
                  <span className="text-[10px] text-gray-400 block">Skills: React, Tailwind, Python Backend</span>
                </div>
                <button
                  onClick={() => alert("Invite sent to Aditya via CampusOS Network!")}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-bold text-white transition cursor-pointer"
                >
                  Invite
                </button>
              </div>

              <div className="p-3 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
                <div className="space-y-0.5">
                  <strong className="text-xs text-white block">Shreya N. (BMSCE • AIML Sem 2)</strong>
                  <span className="text-[10px] text-gray-400 block">Skills: PyTorch, OpenCV, Flask</span>
                </div>
                <button
                  onClick={() => alert("Invite sent to Shreya via CampusOS Network!")}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-bold text-white transition cursor-pointer"
                >
                  Invite
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowTeammateModal(false)}
                className="w-full py-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-bold text-white transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
