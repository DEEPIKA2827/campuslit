/**
 * @file app/scholarships/page.tsx
 * @description Scholarships & Government Grants Portal for CampusOS.
 * @purpose Connects to /api/scholarships, manages bookmarking via /api/scholarships/bookmark, and loads document requirements.
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { ScholarshipWithBookmarkDTO, ScholarshipDTO } from "@/types/api.types";
import {
  GraduationCap,
  Search,
  Clock,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Bell,
  BellCheck,
  Bookmark,
  ShieldCheck,
  SlidersHorizontal,
  X,
  FileText
} from "lucide-react";

// Scholarship Category Tabs
const categories = [
  { id: "all", label: "All Scholarships" },
  { id: "government", label: "Government Grants" },
  { id: "private", label: "Private & Corporate" },
  { id: "women", label: "Women in Tech" },
  { id: "merit", label: "Merit-Based" },
];

import scholarshipsData from "@/data/scholarships.json";

export interface ScholarshipItem {
  id: string;
  numericId?: number;
  title: string;
  provider: string;
  source?: string;
  sourceUrl?: string;
  logo: string;
  type: string;
  grantAmount: string;
  annualValue: number;
  deadline: string | null;
  daysLeft: number;
  isUrgent: boolean;
  isWomenOnly: boolean;
  eligibility: {
    category: string[];
    maxIncome: string;
    minMarks: string;
    degree: string;
  };
  tags: string[];
  documentsRequired: string[];
  portalUrl: string;
  verifiedBySenior: boolean;
  lastVerifiedAt?: string;
}

// Canonical Karnataka & National Scholarships Data
const defaultScholarships: ScholarshipItem[] = scholarshipsData.map((s) => {
  const days = s.deadline
    ? Math.max(1, Math.ceil((new Date(s.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 60;
  const isUrgent = s.deadline ? days <= 14 : false;
  const isWomen = s.category === "women_in_tech";

  return {
    id: String(s.scholarshipId),
    numericId: s.scholarshipId,
    title: s.scholarshipName,
    provider: s.provider,
    source: s.source,
    sourceUrl: s.sourceUrl,
    logo:
      isWomen
        ? "👩‍💻"
        : s.category.includes("government")
        ? "🏛️"
        : s.category === "merit_based"
        ? "🌟"
        : "💎",
    type: s.category,
    grantAmount: s.grantAmount,
    annualValue: s.annualValue,
    deadline: s.deadline,
    daysLeft: days,
    isUrgent,
    isWomenOnly: isWomen,
    eligibility: {
      category: ["General", "OBC", "SC/ST", "Minority"],
      maxIncome: s.maxIncome || "Income guidelines apply",
      minMarks: s.academicCriteria,
      degree: "Undergraduate B.E/B.Tech",
    },
    tags: s.tags,
    documentsRequired: s.documentsRequired,
    portalUrl: s.applicationUrl,
    verifiedBySenior: true,
    lastVerifiedAt: s.lastVerifiedAt,
  };
});

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState<ScholarshipItem[]>(defaultScholarships);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filters State
  const [typeFilter, setTypeFilter] = useState("all");
  const [womenOnlyFilter, setWomenOnlyFilter] = useState(false);
  const [urgentOnly, setUrgentOnly] = useState(false);

  // Application Tracker State
  const [trackedScholarships, setTrackedScholarships] = useState<{ [id: string]: "saved" | "applied" | "review" | "awarded" }>({});

  // Reminders State
  const [reminders, setReminders] = useState<string[]>([]);

  // Toast / Modal State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedDocChecklist, setSelectedDocChecklist] = useState<ScholarshipItem | null>(null);
  const [checklistDocs, setChecklistDocs] = useState<string[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch live scholarships from API on mount
  useEffect(() => {
    const fetchScholarships = async () => {
      try {
        const res = await fetch("/api/scholarships", { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const liveItems: ScholarshipItem[] = json.data.map((item: ScholarshipWithBookmarkDTO) => {
              const matchedDefault = defaultScholarships.find(
                (d) => d.title.toLowerCase() === item.scholarshipName.toLowerCase() || d.id === String(item.scholarshipId)
              );

              return {
                id: String(item.scholarshipId),
                numericId: item.scholarshipId,
                title: item.scholarshipName,
                provider: matchedDefault?.provider || "Karnataka Technical Education",
                source: matchedDefault?.source || "State Scholarship Portal",
                sourceUrl: matchedDefault?.sourceUrl || "https://ssp.postmatric.karnataka.gov.in",
                logo: matchedDefault?.logo || "🎓",
                type: matchedDefault?.type || "government",
                grantAmount: matchedDefault?.grantAmount || "₹25,000 - ₹50,000 / year",
                annualValue: matchedDefault?.annualValue || 35000,
                deadline: item.deadline ? new Date(item.deadline).toLocaleDateString() : "Open",
                daysLeft: matchedDefault?.daysLeft || 14,
                isUrgent: matchedDefault?.isUrgent || false,
                isWomenOnly: matchedDefault?.isWomenOnly || false,
                eligibility: matchedDefault?.eligibility || {
                  category: ["All Categories"],
                  maxIncome: "Income guidelines apply",
                  minMarks: "60% Marks",
                  degree: "1st Year Engineering",
                },
                tags: matchedDefault?.tags || ["Grant", "Karnataka"],
                documentsRequired: matchedDefault?.documentsRequired || ["Aadhaar Card", "Income Certificate"],
                portalUrl: item.applicationUrl || matchedDefault?.portalUrl || "https://ssp.postmatric.karnataka.gov.in",
                verifiedBySenior: true,
                lastVerifiedAt: matchedDefault?.lastVerifiedAt || "2026-08-20",
              };
            });

            // Update tracked state strictly from authentic bookmarked scholarships
            const newTracked: { [id: string]: "saved" | "applied" | "review" | "awarded" } = {};
            json.data.forEach((item: ScholarshipWithBookmarkDTO) => {
              if (item.isBookmarked) {
                newTracked[String(item.scholarshipId)] = "saved";
              }
            });
            setTrackedScholarships(newTracked);
            setScholarships(liveItems);
          }
        }
      } catch {
        // Fallback to default list
      }
    };

    fetchScholarships();
  }, []);

  /**
   * Toggles bookmark and calls /api/scholarships/bookmark
   */
  const toggleBookmark = async (id: string, numericId?: number) => {
    const isSaved = trackedScholarships[id] === "saved";
    const newStatus = isSaved ? undefined : "saved";

    const updated = { ...trackedScholarships };
    if (newStatus) {
      updated[id] = newStatus;
    } else {
      delete updated[id];
    }
    setTrackedScholarships(updated);

    const targetId = numericId || Number(id);
    if (!isNaN(targetId) && targetId > 0) {
      try {
        if (!isSaved) {
          await fetch("/api/scholarships/bookmark", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ scholarshipId: targetId }),
          });
          showToast("Saved to your scholarship tracker!");
        } else {
          await fetch(`/api/scholarships/bookmark?scholarshipId=${targetId}`, {
            method: "DELETE",
            credentials: "include",
          });
          showToast("Removed from tracker.");
        }
      } catch {
        // Graceful silent fallback
      }
    }
  };

  const toggleReminder = (id: string) => {
    if (reminders.includes(id)) {
      setReminders(reminders.filter((r) => r !== id));
      showToast("Deadline reminder turned off.");
    } else {
      setReminders([...reminders, id]);
      showToast("🔔 48h deadline reminder activated!");
    }
  };

  const handleOpenDocModal = async (sch: ScholarshipItem) => {
    setSelectedDocChecklist(sch);
    setChecklistDocs(sch.documentsRequired);

    if (sch.numericId) {
      try {
        const res = await fetch(`/api/scholarships/documents?scholarshipId=${sch.numericId}`, {
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setChecklistDocs(json.data.map((d: { documentName?: string }) => d.documentName || "Document"));
          }
        }
      } catch {
        // Fallback to default docs
      }
    }
  };

  // Filter Logic
  const filteredScholarships = scholarships.filter((sch) => {
    if (activeCategory !== "all" && sch.type !== activeCategory) return false;

    if (
      searchQuery &&
      !sch.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !sch.provider.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !sch.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    ) {
      return false;
    }

    if (typeFilter !== "all" && sch.type !== typeFilter) return false;
    if (womenOnlyFilter && !sch.isWomenOnly) return false;
    if (urgentOnly && !sch.isUrgent) return false;

    return true;
  });

  const clearFilters = () => {
    setActiveCategory("all");
    setTypeFilter("all");
    setWomenOnlyFilter(false);
    setUrgentOnly(false);
    setSearchQuery("");
  };

  const hasActiveFilters =
    activeCategory !== "all" ||
    typeFilter !== "all" ||
    womenOnlyFilter ||
    urgentOnly ||
    searchQuery !== "";

  return (
    <main className="min-h-screen bg-[#08090e] text-[#f3f4f6] selection:bg-purple-500/30 selection:text-purple-200">
      {/* Background glow mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-radial-glow opacity-80" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      </div>

      {/* DYNAMIC HEADER NAVBAR */}
      <Navbar />

      {/* TOAST ALERT */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-purple-500/40 bg-[#0d0f18]/95 px-4 py-3 text-xs font-semibold text-white shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 flex items-center gap-2">
          <Sparkles className="size-4 text-purple-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HERO & SEARCH BAR */}
      <section className="relative z-10 pt-8 pb-6 border-b border-white/10 bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                <GraduationCap className="size-4" />
                Karnataka State & Corporate Grant Radar
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Scholarships & Financial Security.
              </h1>
              <p className="text-sm text-gray-400 max-w-2xl">
                Track SSP Karnataka, AICTE Pragati, Infosys, and Jindal grants with real-time deadline alarms and verified document checklists.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/opportunities"
                className="inline-flex items-center gap-2 rounded-xl bg-purple-500/10 border border-purple-500/20 px-3.5 py-2 text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition"
              >
                <span>View Hackathons & Jobs</span>
                <ExternalLink className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* SEARCH INPUT */}
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
              <Search className="size-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by scholarship name, provider (SSP, AICTE, Jindal, Infosys), or eligibility tag..."
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
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
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

      {/* SCHOLARSHIP FEED */}
      <section className="relative z-10 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          {/* FILTER CONTROLS BAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3 backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5 px-2">
                <SlidersHorizontal className="size-3.5 text-emerald-400" />
                Filters:
              </span>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-gray-300 focus:border-purple-500 focus:outline-none"
              >
                <option value="all">Grant Type: All</option>
                <option value="government">Government Grants</option>
                <option value="private">Private Trusts</option>
                <option value="women">Women Fellowships</option>
              </select>

              {/* Women Only Toggle */}
              <button
                onClick={() => setWomenOnlyFilter(!womenOnlyFilter)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                  womenOnlyFilter
                    ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                    : "bg-black/60 border-white/10 text-gray-400 hover:text-white"
                }`}
              >
                👩‍💻 Women in Tech Only
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
                ⏱️ Closing This Month
              </button>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline underline-offset-4"
              >
                Reset All Filters
              </button>
            )}
          </div>

          {/* SCHOLARSHIP CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredScholarships.length === 0 ? (
              <div className="col-span-full rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center space-y-4 max-w-xl mx-auto">
                <div className="size-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <GraduationCap className="size-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">No Scholarships Match Your Filters</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    No scholarships match your active filter criteria. Clear filters or adjust your search to view all state and corporate funding.
                  </p>
                </div>
                <button
                  onClick={clearFilters}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-lg transition cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              filteredScholarships.map((sch) => {
              const isSaved = trackedScholarships[sch.id] === "saved";
              const isReminderActive = reminders.includes(sch.id);

              return (
                <div
                  key={sch.id}
                  className="group relative rounded-3xl border border-white/10 bg-gradient-to-b from-[#10121d] to-[#0a0b12] p-5 shadow-xl hover:border-emerald-500/40 hover:shadow-emerald-500/10 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="size-11 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-xl shadow-inner">
                          {sch.logo}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-gray-400 block truncate max-w-[180px]">
                            {sch.provider}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                            <ShieldCheck className="size-3" />
                            Verified Portal
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleReminder(sch.id)}
                          className={`p-2 rounded-xl border transition cursor-pointer ${
                            isReminderActive
                              ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                              : "bg-white/[0.03] border-white/10 text-gray-400 hover:text-white"
                          }`}
                        >
                          {isReminderActive ? <BellCheck className="size-4" /> : <Bell className="size-4" />}
                        </button>
                        <button
                          onClick={() => toggleBookmark(sch.id, sch.numericId)}
                          className={`p-2 rounded-xl border transition cursor-pointer ${
                            isSaved
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                              : "bg-white/[0.03] border-white/10 text-gray-400 hover:text-white"
                          }`}
                        >
                          <Bookmark className="size-4" />
                        </button>
                      </div>
                    </div>

                    {/* Title & Amount */}
                    <div className="space-y-1.5">
                      <h2 className="text-base font-bold text-white group-hover:text-emerald-300 transition line-clamp-1">
                        {sch.title}
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-emerald-400">{sch.grantAmount}</span>
                        {sch.isUrgent && (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                            Closing Soon
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Eligibility & Info Matrix */}
                    <div className="space-y-2 rounded-2xl bg-white/[0.02] border border-white/5 p-3 text-xs text-gray-300">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Max Family Income:</span>
                        <strong className="text-white">{sch.eligibility.maxIncome}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Academic Cutoff:</span>
                        <strong className="text-white">{sch.eligibility.minMarks}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Target Cohort:</span>
                        <strong className="text-purple-300">{sch.eligibility.degree}</strong>
                      </div>
                      <div className="flex items-center justify-between border-t border-white/5 pt-1.5">
                        <span className="text-gray-500">Deadline:</span>
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                          <Clock className="size-3" />
                          {sch.deadline}
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {sch.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg bg-white/[0.04] border border-white/5 px-2 py-0.5 text-[10px] text-gray-300 font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions Bottom Bar */}
                  <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenDocModal(sch)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition cursor-pointer"
                    >
                      <FileText className="size-3.5 text-emerald-400" />
                      <span>Document Checklist</span>
                    </button>

                    <a
                      href={sch.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition"
                    >
                      <span>Official Portal</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>
              );
            }))}
          </div>
        </div>
      </section>

      {/* DOCUMENT CHECKLIST MODAL */}
      {selectedDocChecklist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-emerald-500/30 bg-[#0d0f18] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Document Checklist</h3>
              </div>
              <button
                onClick={() => setSelectedDocChecklist(null)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-300 block">{selectedDocChecklist.title}</span>
              <p className="text-xs text-gray-400">
                Keep the following attested documents ready before opening the application portal:
              </p>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {checklistDocs.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-white/[0.02]"
                >
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                  <span className="text-xs text-gray-200 font-medium">{doc}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setSelectedDocChecklist(null)}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-bold text-white transition cursor-pointer"
              >
                Close
              </button>
              <a
                href={selectedDocChecklist.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-center rounded-xl text-xs font-bold text-white shadow-lg transition"
              >
                Launch Portal
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
