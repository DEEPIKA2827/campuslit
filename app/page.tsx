/**
 * @file app/page.tsx
 * @description CampusOS Mission Control & Interactive Student Operating System.
 * @purpose Serves as both the landing page for prospective students and interactive Mission Control for authenticated users.
 * @features Live attendance radar, 75% Bunk Defense calculator, CIE marks, syllabus tracker, senior playbooks, and quick attendance logging.
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { useAuth } from "@/components/auth/auth-provider";
import {
  AttendanceSummaryWithCourseDTO,
  CourseDTO,
  StudentCieMarkWithCourseDTO,
  VivaQuestionDTO
} from "@/types/api.types";
import { ActionRadarResponseDTO } from "@/types/action-radar.types";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  Layers,
  Layout,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Zap,
  ArrowRight,
  Sliders,
  Bell,
  Code,
  ChevronDown,
  Building2,
  Check,
  AlertTriangle,
  XCircle,
  Terminal,
  Users,
  Plus,
  X
} from "lucide-react";

// Workspace Navigation Tabs
const workspaceTabs = [
  {
    id: "academics",
    label: "Academic Command",
    badge: "VTU 2025 Scheme",
    icon: BookOpen,
  },
  {
    id: "attendance",
    label: "CIE & Attendance Radar",
    badge: "75% Threshold Alert",
    icon: ShieldCheck,
  },
  {
    id: "seniors",
    label: "Senior Playbooks",
    badge: "Verified Vivas",
    icon: UserCheck,
  },
  {
    id: "skills",
    label: "Skill & Career Path",
    badge: "Sem 1 Roadmap",
    icon: Code,
  },
];

// Mock Karnataka Engineering Colleges for Waitlist / Preview
const karnatakaColleges = [
  "RV College of Engineering (RVCE), Bengaluru",
  "BMS College of Engineering (BMSCE), Bengaluru",
  "PES University, Bengaluru",
  "MS Ramaiah Institute of Technology (MSRIT), Bengaluru",
  "Nitte Meenakshi Institute of Technology (NMIT), Bengaluru",
  "KLS Gogte Institute of Technology (GIT), Belagavi",
  "The National Institute of Engineering (NIE), Mysore",
  "Siddaganga Institute of Technology (SIT), Tumakuru",
  "SJCE (JSSSTU), Mysore",
  "VTU Main Campus, Belagavi",
  "BMSIT & Management, Bengaluru",
  "BIT, Bengaluru",
  "Other VTU / Autonomous College in Karnataka",
];

const engineeringBranches = [
  "Computer Science & Engineering (CSE)",
  "Information Science & Engineering (ISE)",
  "AI & Machine Learning (AI & ML / AI & DS)",
  "Electronics & Communication (ECE)",
  "Electrical & Electronics (EEE)",
  "Mechanical Engineering",
  "Civil Engineering",
  "Biotechnology / Other Branch",
];

const featuresList = [
  {
    icon: Layers,
    title: "VTU & Autonomous Syllabus Engine",
    tag: "Auto-synced",
    description:
      "No more hunting old PDFs. Complete module breakdown for 2022 & 2025 schemes with weightage, previous year questions (PYQs), and marking schemes.",
    accent: "from-purple-500/20 to-indigo-500/20",
    border: "group-hover:border-purple-500/40",
  },
  {
    icon: ShieldCheck,
    title: "CIE Marks & Attendance Risk Radar",
    tag: "75% Cutoff Defense",
    description:
      "Predictive calculations for IA1, IA2, IA3 & Lab CIE. Know exact Bunk Allowances and minimum marks needed to avoid condonation lists.",
    accent: "from-blue-500/20 to-cyan-500/20",
    border: "group-hover:border-blue-500/40",
  },
  {
    icon: UserCheck,
    title: "Verified Senior Playbooks",
    tag: "Zero WhatsApp Noise",
    description:
      "Curated guidance from top 3rd/4th year students: lab record shortcuts, professor expectations, viva cheat sheets, and scoring hacks.",
    accent: "from-emerald-500/20 to-teal-500/20",
    border: "group-hover:border-emerald-500/40",
  },
  {
    icon: Code,
    title: "1st-Year Skill & Placement Roadmap",
    tag: "Day 1 Advantage",
    description:
      "Structured progression from C/Python basics to LeetCode starter sets, GitHub setup, hackathon prep, and building proof-of-work projects.",
    accent: "from-amber-500/20 to-orange-500/20",
    border: "group-hover:border-amber-500/40",
  },
  {
    icon: Bell,
    title: "Verified College Feed",
    tag: "No Fake Circulars",
    description:
      "Filter out 50+ WhatsApp group forwards. Get verified official announcements, exam timetables, and college event alerts for your branch.",
    accent: "from-pink-500/20 to-rose-500/20",
    border: "group-hover:border-pink-500/40",
  },
  {
    icon: Users,
    title: "Peer & Tech Club Network",
    tag: "Karnataka Wide",
    description:
      "Discover active IEEE, GDSC, ACM tech clubs, hackathon teammates, and project collaborators across top engineering campuses.",
    accent: "from-cyan-500/20 to-blue-500/20",
    border: "group-hover:border-cyan-500/40",
  },
];

const journeySteps = [
  {
    number: "01",
    phase: "Month 0 — Admission & Induction",
    title: "Surviving the First-Week Overwhelm",
    description:
      "Hostel survival checklists, VTU vs Autonomous grading system demystified, branch overview, and key faculty contacts.",
    details: [
      "Decipher SGPA vs CGPA calculation",
      "VTU Physics vs Chemistry Cycle breakdown",
      "Essential student software & GitHub Student Pack",
    ],
  },
  {
    number: "02",
    phase: "Month 1-3 — Internals & Lab Viva",
    title: "Conquering CIE & Attendance",
    description:
      "Stay ahead of IA1/IA2 exam windows, lab record submission deadlines, and monitor your 75% attendance threshold effortlessly.",
    details: [
      "Automated attendance buffer calculator",
      "Lab record diagrams & observation formulas",
      "IA exam target score projector",
    ],
  },
  {
    number: "03",
    phase: "Month 4-6 — End-Sem & Coding Path",
    title: "Building Technical Proof-of-Work",
    description:
      "Finish SEE exams with high SGPA and launch your tech profile with first-year coding roadmaps and hackathons.",
    details: [
      "Verified PYQ solutions for End-Sem exams",
      "Starter projects in C++, Python, and Web",
      "1st-Year Hackathon entry playbooks",
    ],
  },
  {
    number: "04",
    phase: "Year 2+ — Internships & Placements",
    title: "Long-Term Career Acceleration",
    description:
      "Transition from foundational engineering into specialized domains, research projects, and tier-1 company placements.",
    details: [
      "Data Structures & Algorithms progression",
      "Senior mentorship matching",
      "Resume & LinkedIn review for tech roles",
    ],
  },
];

const faqs = [
  {
    q: "Is CampusOS tailored for both VTU affiliated and Autonomous colleges?",
    a: "Yes! CampusOS supports VTU 2022 and 2025 schemes as well as autonomous college credit structures (e.g. RVCE, PES, BMSCE, MSRIT). You can customize your syllabus, CIE rules, and grading scale during setup.",
  },
  {
    q: "How does CampusOS solve the WhatsApp & Telegram information clutter?",
    a: "Instead of searching through 400+ forwarded WhatsApp messages, CampusOS aggregates verified notices, lab records, notes, and exam schedules into clean, searchable cards organized by subject and semester.",
  },
  {
    q: "Is CampusOS free for first-year engineering students?",
    a: "Yes, the core CampusOS workspace (Syllabus Engine, CIE Tracker, Attendance Radar, and Basic Senior Playbooks) is 100% free for students throughout their engineering journey.",
  },
  {
    q: "How do Senior Playbooks work?",
    a: "Senior Playbooks are submitted by vetted 3rd & 4th-year engineering students from your college. They provide practical tips on how specific professors grade labs, common viva questions, and high-yield topics for internals.",
  },
];

export default function Home() {
  const { isAuthenticated, profile } = useAuth();

  const [activeTab, setActiveTab] = useState("academics");
  const [activeJourney, setActiveJourney] = useState(0);

  // Live Backend Data States
  const [attendanceSummaries, setAttendanceSummaries] = useState<AttendanceSummaryWithCourseDTO[]>([]);
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [cieMarks, setCieMarks] = useState<StudentCieMarkWithCourseDTO[]>([]);
  const [vivaQuestions, setVivaQuestions] = useState<VivaQuestionDTO[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [actionRadar, setActionRadar] = useState<ActionRadarResponseDTO | null>(null);

  // Quick Attendance Logger Modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [logCourseId, setLogCourseId] = useState<number>(1);
  const [logStatus, setLogStatus] = useState<"present" | "absent" | "late">("present");
  const [logLoading, setLogLoading] = useState(false);
  const [logSuccessMessage, setLogSuccessMessage] = useState<string | null>(null);

  // Simulator State
  const [simAttendance, setSimAttendance] = useState<number>(82);
  const [targetSGPA, setTargetSGPA] = useState<number>(8.5);

  // Waitlist Form State
  const [email, setEmail] = useState("");
  const [college, setCollege] = useState("");
  const [branch, setBranch] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // FAQ Accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Fetch live dashboard metrics if student is authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchDashboardData = async () => {
      try {
        // 1. Fetch Attendance Dashboard
        const attRes = await fetch("/api/attendance", { credentials: "include" });
        if (attRes.ok) {
          const attJson = await attRes.json();
          if (attJson.success && Array.isArray(attJson.data)) {
            setAttendanceSummaries(attJson.data);
            if (attJson.data.length > 0 && !selectedCourseId) {
              setSelectedCourseId(attJson.data[0].courseId);
              setLogCourseId(attJson.data[0].courseId);
            }
          }
        }

        // 2. Fetch Enrolled Courses
        const courseRes = await fetch("/api/academics/courses", { credentials: "include" });
        if (courseRes.ok) {
          const courseJson = await courseRes.json();
          if (courseJson.success && Array.isArray(courseJson.data)) {
            setCourses(courseJson.data);
            if (courseJson.data.length > 0 && !selectedCourseId) {
              setSelectedCourseId(courseJson.data[0].courseId);
              setLogCourseId(courseJson.data[0].courseId);
            }
          }
        }

        // 3. Fetch CIE Marks
        const marksRes = await fetch("/api/assessments/marks", { credentials: "include" });
        if (marksRes.ok) {
          const marksJson = await marksRes.json();
          if (marksJson.success && Array.isArray(marksJson.data)) {
            setCieMarks(marksJson.data);
          }
        }

        // 4. Fetch Proactive Action Radar Intelligence
        const radarRes = await fetch("/api/actions/radar", { credentials: "include" });
        if (radarRes.ok) {
          const radarJson = await radarRes.json();
          if (radarJson.success && radarJson.data) {
            setActionRadar(radarJson.data);
          }
        }
      } catch {
        // Fallback to demo mode
      }
    };

    fetchDashboardData();
  }, [isAuthenticated]);

  // Fetch Senior Viva Questions for active selected course
  useEffect(() => {
    if (!isAuthenticated || !selectedCourseId) return;

    const fetchVivaQuestions = async () => {
      try {
        const vivaRes = await fetch(`/api/assessments/viva?courseId=${selectedCourseId}`, { credentials: "include" });
        if (vivaRes.ok) {
          const vivaJson = await vivaRes.json();
          if (vivaJson.success && Array.isArray(vivaJson.data)) {
            setVivaQuestions(vivaJson.data);
          }
        }
      } catch {
        // Fallback gracefully
      }
    };

    fetchVivaQuestions();
  }, [isAuthenticated, selectedCourseId]);

  // Log attendance event directly to backend
  const handleLogAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logCourseId) return;

    setLogLoading(true);
    setLogSuccessMessage(null);

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          courseId: logCourseId,
          attendanceDate: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
          status: logStatus,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setLogSuccessMessage(`Logged as ${logStatus.toUpperCase()}! Recalculating radar...`);
          // Refresh attendance summaries
          const attRes = await fetch("/api/attendance", { credentials: "include" });
          if (attRes.ok) {
            const attJson = await attRes.json();
            if (attJson.success && Array.isArray(attJson.data)) {
              setAttendanceSummaries(attJson.data);
            }
          }
          setTimeout(() => {
            setShowLogModal(false);
            setLogSuccessMessage(null);
          }, 1200);
        }
      }
    } catch {
      // Handled gracefully
    } finally {
      setLogLoading(false);
    }
  };

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  // Calculate live aggregate attendance
  const totalClassesAggregate = attendanceSummaries.reduce((sum, item) => sum + item.totalClasses, 0);
  const attendedClassesAggregate = attendanceSummaries.reduce((sum, item) => sum + item.attendedClasses, 0);
  const liveAttendancePct =
    totalClassesAggregate > 0
      ? parseFloat(((attendedClassesAggregate / totalClassesAggregate) * 100).toFixed(1))
      : 84.2;

  // Real 75% Bunk Defense calculation
  const liveSafeBunks =
    totalClassesAggregate > 0
      ? Math.max(0, Math.floor(attendedClassesAggregate / 0.75 - totalClassesAggregate))
      : Math.max(0, Math.floor((simAttendance - 75) / 2.5));

  // Simulator outputs
  const simBunkAllowance = Math.max(0, Math.floor((simAttendance - 75) / 2.5));
  const simReqIAMarks = Math.min(40, Math.max(16, Math.round(targetSGPA * 4)));

  return (
    <main className="min-h-screen bg-[#08090e] text-[#f3f4f6] selection:bg-purple-500/30 selection:text-purple-200">
      {/* BACKGROUND GLOWS & GRID */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-radial-glow opacity-90" />
        <div className="absolute inset-0 bg-grid-pattern opacity-40" />
      </div>

      {/* DYNAMIC HEADER NAVBAR */}
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold text-purple-300 backdrop-blur-md mb-8 animate-pulse-glow shadow-sm shadow-purple-500/20">
            <Sparkles className="size-3.5 text-purple-400" />
            <span>
              {isAuthenticated && profile
                ? `Logged in as ${profile.firstName} • Semester ${profile.semester || 1} Engineering Workspace`
                : "Built for First-Year VTU & Autonomous Students in Karnataka"}
            </span>
            <ChevronRight className="size-3.5 opacity-70" />
          </div>

          {/* Main Headline */}
          <h1 className="mx-auto max-w-5xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.08]">
            The Operating System for{" "}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              Engineering Life.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-3xl text-base text-gray-300 sm:text-xl leading-relaxed">
            Replace 40+ chaotic WhatsApp groups, lost Telegram PDFs, and sudden exam surprises with one calm, high-precision workspace tailored to Karnataka engineering colleges.
          </p>

          {/* CTA Group */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {isAuthenticated ? (
              <a
                href="#demo"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 px-8 text-base font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:scale-[1.02] hover:shadow-purple-500/50 active:scale-98 sm:w-auto"
              >
                <Terminal className="size-4 text-purple-300" />
                Launch Mission Control
                <ArrowRight className="size-4" />
              </a>
            ) : (
              <Link
                href="/onboarding"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 px-8 text-base font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:scale-[1.02] hover:shadow-purple-500/50 active:scale-98 sm:w-auto"
              >
                <Sparkles className="size-4 text-purple-300" />
                Try Onboarding Flow
                <ArrowRight className="size-4" />
              </Link>
            )}
            <a
              href="#demo"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-8 text-base font-semibold text-gray-200 backdrop-blur-md transition hover:bg-white/[0.08] hover:border-white/30 sm:w-auto"
            >
              <Layout className="size-4 text-purple-400" />
              Explore Interactive Demo
            </a>
          </div>

          {/* Social Proof Stats */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 border-t border-white/10 pt-8 text-left text-xs sm:text-sm text-gray-400">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2 overflow-hidden">
                <div className="inline-block size-7 rounded-full bg-purple-600 ring-2 ring-[#08090e] text-[10px] font-bold flex items-center justify-center text-white">RV</div>
                <div className="inline-block size-7 rounded-full bg-indigo-600 ring-2 ring-[#08090e] text-[10px] font-bold flex items-center justify-center text-white">BMS</div>
                <div className="inline-block size-7 rounded-full bg-cyan-600 ring-2 ring-[#08090e] text-[10px] font-bold flex items-center justify-center text-white">PES</div>
                <div className="inline-block size-7 rounded-full bg-emerald-600 ring-2 ring-[#08090e] text-[10px] font-bold flex items-center justify-center text-white">MSR</div>
              </div>
              <div>
                <span className="font-semibold text-white">2,400+ Students</span> on waitlist
              </div>
            </div>

            <div className="h-4 w-px bg-white/10 hidden sm:block" />

            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-purple-400" />
              <span><strong className="text-white">48+ Karnataka Colleges</strong> covered</span>
            </div>

            <div className="h-4 w-px bg-white/10 hidden sm:block" />

            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-400" />
              <span><strong className="text-white">100% Free</strong> for First-Year Students</span>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE OS MOCKUP / MISSION CONTROL DEMO SECTION */}
      <section id="demo" className="relative pb-24 pt-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
              {isAuthenticated ? "Live Student Mission Control" : "Interactive Workspace Preview"}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Designed like Linear. Focused like Notion.
            </h2>
            <p className="mt-2 text-sm text-gray-400 max-w-xl mx-auto">
              Click through the tabs below to test how CampusOS organizes academics, attendance, viva playbooks, and tech skills.
            </p>

            {/* Interactive Tab Controls */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {workspaceTabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer ${
                      isActive
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/30"
                        : "bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white border border-white/5"
                    }`}
                  >
                    <IconComponent className="size-4" />
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-white/[0.06] text-gray-400"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* OS WINDOW FRAME */}
          {/* PROACTIVE ACTION RADAR & PRIMARY MISSION BANNER (AUTHENTICATED) */}
          {isAuthenticated && actionRadar && (
            <div className="mx-auto max-w-6xl mb-6 space-y-4 text-left">
              {/* PRIMARY MISSION CARD (RULE OF ONE) */}
              <div className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 backdrop-blur-xl shadow-xl transition ${
                actionRadar.primaryMission.urgency === "critical"
                  ? "border-rose-500/40 bg-gradient-to-r from-rose-950/40 via-red-900/20 to-[#0f111a] shadow-rose-950/30"
                  : actionRadar.primaryMission.urgency === "high"
                  ? "border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-yellow-900/20 to-[#0f111a] shadow-amber-950/30"
                  : "border-purple-500/40 bg-gradient-to-r from-purple-950/40 via-indigo-900/20 to-[#0f111a] shadow-purple-950/30"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        actionRadar.primaryMission.urgency === "critical"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : actionRadar.primaryMission.urgency === "high"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      }`}>
                        <Sparkles className="size-3.5" />
                        TODAY&apos;S MISSION • {actionRadar.primaryMission.contextBadge}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        ⏱️ {actionRadar.primaryMission.estimatedMinutes} mins • 🎯 +{actionRadar.primaryMission.xpReward} XP
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                      {actionRadar.primaryMission.title}
                    </h3>
                    <p className="text-sm text-gray-300 max-w-3xl leading-relaxed">
                      {actionRadar.primaryMission.subtitle}
                    </p>

                    {actionRadar.primaryMission.recoveryNote && (
                      <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 inline-block">
                        ⚠️ {actionRadar.primaryMission.recoveryNote}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <Link
                      href={actionRadar.primaryMission.actionUrl}
                      className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-lg transition hover:scale-[1.02] active:scale-98 cursor-pointer ${
                        actionRadar.primaryMission.urgency === "critical"
                          ? "bg-gradient-to-r from-rose-600 to-red-700 shadow-rose-600/30 hover:shadow-rose-500/50"
                          : actionRadar.primaryMission.urgency === "high"
                          ? "bg-gradient-to-r from-amber-600 to-orange-700 shadow-amber-600/30 hover:shadow-amber-500/50"
                          : "bg-gradient-to-r from-purple-600 to-indigo-700 shadow-purple-600/30 hover:shadow-purple-500/50"
                      }`}
                    >
                      <span>{actionRadar.primaryMission.actionLabel}</span>
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* URGENT ALERTS DRAWER (IF ANY EXIST) */}
              {actionRadar.urgentAlerts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {actionRadar.urgentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3.5 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <span className="font-bold text-amber-300 flex items-center gap-1.5">
                          <AlertTriangle className="size-3.5 text-amber-400 shrink-0" />
                          {alert.title}
                        </span>
                        <p className="text-gray-300">{alert.description}</p>
                      </div>
                      <Link
                        href={alert.actionUrl}
                        className="shrink-0 text-amber-400 hover:text-amber-300 underline font-medium mt-0.5"
                      >
                        {alert.actionLabel} &rarr;
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="relative mx-auto max-w-6xl rounded-2xl border border-white/15 bg-[#0f111a]/90 backdrop-blur-2xl p-2 sm:p-4 shadow-[0_20px_80px_rgba(0,0,0,0.8)]">
            {/* Top Mac Window Control Bar */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 pb-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="size-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="size-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-3 text-xs font-mono text-gray-400 flex items-center gap-2">
                  <Terminal className="size-3 text-purple-400" />
                  CampusOS v1.0.4 — [{profile?.collegeId ? "RVCE / VTU 2025 Scheme" : "VTU 2025 Scheme / Sem 1 CSE"}]
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-xs text-gray-400">
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Attendance: {liveAttendancePct}% {liveAttendancePct >= 75 ? "Safe" : "Warning"}
                </span>
                <span className="bg-white/[0.06] px-2.5 py-1 rounded-md text-gray-300">
                  Target: 8.5 SGPA
                </span>
              </div>
            </div>

            {/* Main Window Dashboard Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-2 sm:p-4 text-left">
              {/* Sidebar (4 Cols) */}
              <aside className="lg:col-span-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
                  <span>Enrolled Courses</span>
                  <span className="text-purple-400">
                    {courses.length > 0 ? `${courses.length} Subjects` : "4 Subjects"}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  {(courses.length > 0
                    ? courses
                    : [
                        { courseId: 1, courseName: "Engg Mathematics I", courseCode: "BMAT101" },
                        { courseId: 2, courseName: "C Programming Lab", courseCode: "BPOPS103" },
                        { courseId: 3, courseName: "Physics Cycle Lab", courseCode: "BPHYS102" },
                        { courseId: 4, courseName: "Basic Electronics", courseCode: "BEC104" },
                      ]
                  ).map((c) => {
                    const isSelected = selectedCourseId === c.courseId;
                    return (
                      <div
                        key={c.courseId}
                        onClick={() => setSelectedCourseId(c.courseId)}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition ${
                          isSelected
                            ? "bg-purple-500/15 border border-purple-500/30 text-white font-medium"
                            : "bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]"
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <BookOpen className="size-3.5 text-purple-400 shrink-0" />
                          <span className="truncate">{c.courseName}</span>
                        </span>
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded shrink-0">
                          {c.courseCode || "VTU"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-auto border-t border-white/10 pt-3">
                  <div className="text-[11px] text-gray-400 flex items-center justify-between">
                    <span>Quick Command</span>
                    <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-gray-300">⌘K</kbd>
                  </div>
                </div>
              </aside>

              {/* Main Content View (9 Cols) */}
              <div className="lg:col-span-9 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 space-y-6">
                {/* TAB 1: ACADEMICS */}
                {activeTab === "academics" && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                      <div>
                        <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Module Breakdown</span>
                        <h3 className="text-xl font-bold text-white">
                          {courses.find((c) => c.courseId === selectedCourseId)?.courseName || "Mathematics I (BMAT101)"} — 4 Credits
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full font-medium">
                          IA Target: 36/40
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <span className="text-xs text-gray-400">Current CIE Marks</span>
                        <p className="text-xl font-bold text-white mt-1">
                          {cieMarks.length > 0 ? `${cieMarks[0].marksObtained} / ${cieMarks[0].maxMarks}` : "34 / 40"}
                        </p>
                        <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                          <CheckCircle2 className="size-3" /> IA1 Completed
                        </span>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <span className="text-xs text-gray-400">VTU Exam Weightage</span>
                        <p className="text-xl font-bold text-purple-400 mt-1">50% CIE + 50% SEE</p>
                        <span className="text-[11px] text-gray-400 mt-1 block">Pass Cutoff: 40%</span>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <span className="text-xs text-gray-400">Projected SGPA</span>
                        <p className="text-xl font-bold text-cyan-400 mt-1">8.75 SGPA</p>
                        <span className="text-[11px] text-cyan-300 mt-1 block">On Track for Distinction</span>
                      </div>
                    </div>

                    {/* Syllabus modules */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">VTU Module Syllabus Tracker</h4>
                      
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="size-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">M1</div>
                          <div>
                            <p className="text-sm font-semibold text-white">Calculus & Differential Equations</p>
                            <p className="text-xs text-gray-400">Rolle&apos;s Theorem, Taylor Series, Curvature</p>
                          </div>
                        </div>
                        <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                          <Check className="size-3" /> Completed
                        </span>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="size-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">M2</div>
                          <div>
                            <p className="text-sm font-semibold text-white">Linear Algebra & Matrices</p>
                            <p className="text-xs text-gray-400">Rank of Matrix, Eigenvalues, Cayley-Hamilton Theorem</p>
                          </div>
                        </div>
                        <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                          <Clock className="size-3" /> In Progress (65%)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: ATTENDANCE */}
                {activeTab === "attendance" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div>
                        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">VTU Attendance Radar</span>
                        <h3 className="text-xl font-bold text-white">75% Mandatory Cutoff Monitor</h3>
                      </div>
                      <button
                        onClick={() => setShowLogModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30 transition cursor-pointer"
                      >
                        <Plus className="size-3.5" />
                        <span>Log Attendance</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Overall Attendance</span>
                          <span className={`font-bold ${liveAttendancePct >= 75 ? "text-emerald-400" : "text-rose-400"}`}>
                            {liveAttendancePct}%
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              liveAttendancePct >= 75
                                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                : "bg-gradient-to-r from-rose-500 to-amber-500"
                            }`}
                            style={{ width: `${Math.min(100, liveAttendancePct)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400">
                          Total Classes: <strong className="text-white">{totalClassesAggregate || 120}</strong> | Attended: <strong className="text-white">{attendedClassesAggregate || 101}</strong>
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col justify-between">
                        <div>
                          <span className="text-xs text-gray-400">Calculated Safe Bunks</span>
                          <p className={`text-2xl font-bold mt-1 ${liveSafeBunks > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {liveSafeBunks > 0 ? `${liveSafeBunks} Classes Buffer` : "0 Classes (At Cutoff!)"}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400">
                          {liveSafeBunks > 0
                            ? `You can safely miss ${liveSafeBunks} classes without dipping below 75%.`
                            : "Must attend upcoming lectures to avoid detention lists."}
                        </p>
                      </div>
                    </div>

                    {/* Course Attendance List */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Subject Attendance Radar</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(attendanceSummaries.length > 0
                          ? attendanceSummaries
                          : [
                              { summaryId: 1, courseName: "Engg Mathematics I", courseCode: "BMAT101", totalClasses: 30, attendedClasses: 26, attendancePercentage: 86.6 },
                              { summaryId: 2, courseName: "C Programming Lab", courseCode: "BPOPS103", totalClasses: 24, attendedClasses: 21, attendancePercentage: 87.5 },
                              { summaryId: 3, courseName: "Physics Cycle Lab", courseCode: "BPHYS102", totalClasses: 20, attendedClasses: 16, attendancePercentage: 80.0 },
                              { summaryId: 4, courseName: "Basic Electronics", courseCode: "BEC104", totalClasses: 26, attendedClasses: 21, attendancePercentage: 80.7 },
                            ]
                        ).map((s, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between"
                          >
                            <div>
                              <strong className="text-xs text-white block">{s.courseName}</strong>
                              <span className="text-[10px] text-gray-400">{s.attendedClasses}/{s.totalClasses} Classes</span>
                            </div>
                            <span
                              className={`text-xs font-bold px-2 py-1 rounded-lg ${
                                s.attendancePercentage >= 75
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-rose-500/20 text-rose-300"
                              }`}
                            >
                              {s.attendancePercentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: SENIOR PLAYBOOKS */}
                {activeTab === "seniors" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div>
                        <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Senior Intel</span>
                        <h3 className="text-xl font-bold text-white">Verified 3rd & 4th Year Playbooks</h3>
                      </div>
                      <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-medium">
                        RVCE & BMSCE Seniors Vetted
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(vivaQuestions.length > 0
                        ? vivaQuestions.slice(0, 4)
                        : [
                            { vivaId: 1, question: "Top 15 Pointers & Recursion Questions: External examiners always test call-by-value vs call-by-reference.", difficulty: "medium" },
                            { vivaId: 2, question: "VTU Repeated Derivations for M2: Cayley-Hamilton 7-mark derivation appears in 8 out of 10 VTU papers.", difficulty: "hard" },
                          ]
                      ).map((v, idx) => (
                        <div key={idx} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-400 uppercase">
                              Viva Question #{idx + 1}
                            </span>
                            <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded capitalize">
                              {v.difficulty || "Important"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed">{v.question}</p>
                          <div className="pt-2 text-[11px] text-gray-400 flex items-center gap-2">
                            <UserCheck className="size-3 text-emerald-400" />
                            <span>Verified by Karnataka Senior Guild</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: SKILL ROADMAP */}
                {activeTab === "skills" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div>
                        <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Sem 1 Career Engine</span>
                        <h3 className="text-xl font-bold text-white">First-Year Technical Progression</h3>
                      </div>
                      <Link
                        href="/roadmap"
                        className="inline-flex items-center gap-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full text-xs font-medium hover:bg-cyan-500/30 transition"
                      >
                        <span>Full Roadmap Hub</span>
                        <ArrowRight className="size-3" />
                      </Link>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">01</div>
                          <div>
                            <p className="text-sm font-semibold text-white">Git, GitHub & Linux Command Line</p>
                            <p className="text-xs text-gray-400">Create GitHub profile, commit lab codes, learn basic bash</p>
                          </div>
                        </div>
                        <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-medium">Completed</span>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">02</div>
                          <div>
                            <p className="text-sm font-semibold text-white">Data Structures in C / C++ Starter</p>
                            <p className="text-xs text-gray-400">Arrays, Pointers, Linked Lists & 25 LeetCode Easy problems</p>
                          </div>
                        </div>
                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full font-medium">In Progress</span>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">03</div>
                          <div>
                            <p className="text-sm font-semibold text-white">First Hackathon & Full-Stack Basics</p>
                            <p className="text-xs text-gray-400">Build a mini-project for college tech fest (IEEE / GDSC)</p>
                          </div>
                        </div>
                        <span className="text-xs bg-white/10 text-gray-400 px-2.5 py-1 rounded-full font-medium">Up Next</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK ATTENDANCE LOGGER MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-emerald-500/30 bg-[#0d0f18] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Log Today&apos;s Attendance</h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {logSuccessMessage ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <CheckCircle2 className="size-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-emerald-300">{logSuccessMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleLogAttendance} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Select Course</label>
                  <select
                    value={logCourseId}
                    onChange={(e) => setLogCourseId(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  >
                    {(courses.length > 0
                      ? courses
                      : [{ courseId: 1, courseName: "Engg Mathematics I (BMAT101)" }]
                    ).map((c) => (
                      <option key={c.courseId} value={c.courseId} className="bg-gray-900 text-gray-200">
                        {c.courseName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["present", "absent", "late"] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setLogStatus(st)}
                        className={`py-2 text-xs font-semibold rounded-xl border transition capitalize cursor-pointer ${
                          logStatus === st
                            ? "bg-emerald-600 border-emerald-500 text-white shadow-lg"
                            : "bg-white/[0.03] border-white/10 text-gray-400 hover:text-white"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowLogModal(false)}
                    className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-bold text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={logLoading}
                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition disabled:opacity-50 cursor-pointer"
                  >
                    {logLoading ? "Saving..." : "Record Entry"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FEATURES GRID SECTION */}
      <section id="features" className="py-24 relative z-10 border-t border-white/10 bg-[#08090e]/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
              Complete Feature Suite
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Everything a first-year engineer needs to thrive.
            </h2>
            <p className="mt-4 text-base text-gray-400">
              Built ground-up to fix the specific friction points of VTU and autonomous engineering colleges in Karnataka.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuresList.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={idx}
                  className={`group relative rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/[0.05] ${feat.border}`}
                >
                  <div className={`size-12 rounded-xl bg-gradient-to-br ${feat.accent} flex items-center justify-center mb-5 border border-white/10 text-purple-300`}>
                    <IconComp className="size-6" />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white">{feat.title}</h3>
                    <span className="text-[10px] font-semibold bg-white/10 text-gray-300 px-2 py-0.5 rounded-full border border-white/10">
                      {feat.tag}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* INTERACTIVE SIMULATOR WIDGET SECTION */}
      <section id="simulator" className="py-20 relative z-10 border-t border-white/10 bg-gradient-to-b from-[#0f111d] to-[#08090e]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Info Column */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                <Sliders className="size-4" />
                Live Interactive Tool
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl leading-tight">
                Try the VTU CIE & Attendance Risk Simulator.
              </h2>
              <p className="text-base text-gray-300 leading-relaxed">
                Test how CampusOS predicts your exam eligibility and calculates exact bunk allowances before your college posts detention notices.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-emerald-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Automated 75% Attendance Safeguard</h4>
                    <p className="text-xs text-gray-400">Prevents last-minute condonation fee payments or exam hall ticket holds.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-purple-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-sm font-bold text-white">IA Target Marks Calculator</h4>
                    <p className="text-xs text-gray-400">Tells you precisely what score you need in IA2/IA3 to reach your target SGPA.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Interactive Simulator Widget Box */}
            <div className="lg:col-span-7 rounded-2xl border border-white/15 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Cpu className="size-5 text-purple-400" />
                  CIE & Attendance Risk Calculator
                </h3>
                <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30">
                  Live Preview
                </span>
              </div>

              {/* Slider 1: Attendance */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <label className="text-gray-300 font-medium">Current Attendance Percentage</label>
                  <span className={`font-bold ${simAttendance >= 75 ? "text-emerald-400" : "text-rose-400"}`}>
                    {simAttendance}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={simAttendance}
                  onChange={(e) => setSimAttendance(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>50% (Detained Risk)</span>
                  <span>75% (VTU Minimum)</span>
                  <span>100% (Perfect)</span>
                </div>
              </div>

              {/* Slider 2: Target SGPA */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <label className="text-gray-300 font-medium">Target SGPA (Semester Grade)</label>
                  <span className="font-bold text-purple-400">{targetSGPA.toFixed(1)} SGPA</span>
                </div>
                <input
                  type="range"
                  min="6.0"
                  max="10.0"
                  step="0.1"
                  value={targetSGPA}
                  onChange={(e) => setTargetSGPA(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>6.0 (First Class)</span>
                  <span>8.5 (Distinction)</span>
                  <span>10.0 (Gold Medal)</span>
                </div>
              </div>

              {/* SIMULATOR OUTPUT BOX */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-gray-400">Allowed Safe Bunks Left</span>
                  <div className="text-2xl font-extrabold text-white flex items-center gap-2">
                    {simBunkAllowance > 0 ? (
                      <span className="text-emerald-400">{simBunkAllowance} Classes</span>
                    ) : (
                      <span className="text-rose-400">0 Classes (Must Attend!)</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400">Based on 75% cutoff threshold.</p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-gray-400">Min. IA Score Needed</span>
                  <div className="text-2xl font-extrabold text-purple-400">
                    {simReqIAMarks} / 40 Marks
                  </div>
                  <p className="text-[11px] text-gray-400">To achieve {targetSGPA} SGPA.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STUDENT JOURNEY SECTION */}
      <section id="journey" className="py-24 relative z-10 border-t border-white/10 bg-[#08090e]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              Student Journey Arc
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              From confused fresher to intentional engineer.
            </h2>
            <p className="mt-4 text-base text-gray-400">
              CampusOS guides you through every milestone from day one of college until placement season.
            </p>
          </div>

          {/* Stepper Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Timeline selector (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              {journeySteps.map((step, idx) => {
                const isActive = activeJourney === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveJourney(idx)}
                    className={`p-4 rounded-xl border transition cursor-pointer ${
                      isActive
                        ? "bg-purple-600/15 border-purple-500/40 text-white shadow-lg"
                        : "bg-white/[0.02] border-white/5 text-gray-400 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isActive ? "text-purple-400" : "text-gray-500"}`}>
                        {step.number} — {step.phase}
                      </span>
                      {isActive && <ChevronRight className="size-4 text-purple-400" />}
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">{step.title}</h3>
                  </div>
                );
              })}
            </div>

            {/* Active Step Details Panel (7 cols) */}
            <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">
                    {journeySteps[activeJourney].phase}
                  </span>
                  <h3 className="text-2xl font-bold text-white mt-1">
                    {journeySteps[activeJourney].title}
                  </h3>
                </div>
                <span className="size-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-bold text-purple-300">
                  {journeySteps[activeJourney].number}
                </span>
              </div>

              <p className="text-sm text-gray-300 leading-relaxed">
                {journeySteps[activeJourney].description}
              </p>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Key CampusOS Deliverables</h4>
                {journeySteps[activeJourney].details.map((detail, dIdx) => (
                  <div key={dIdx} className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/30 p-3 text-sm text-gray-200">
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CHAOS VS CAMPUSOS MATRIX */}
          <div className="mt-20 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 backdrop-blur-xl">
            <h3 className="text-xl font-bold text-white text-center mb-8">
              Why Students Switch from WhatsApp Groups to CampusOS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* WhatsApp Chaos Box */}
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-5 space-y-4">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <XCircle className="size-5" />
                  <span>The WhatsApp & Telegram Chaos</span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5">✕</span>
                    <span>40+ unorganized chat groups with 500+ spam messages daily</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5">✕</span>
                    <span>Lost PDFs, corrupted notes, and outdated syllabus links</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5">✕</span>
                    <span>Surprise exam dates and unexpected attendance shortage notices</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5">✕</span>
                    <span>Asking random seniors for viva questions without verification</span>
                  </li>
                </ul>
              </div>

              {/* CampusOS Way Box */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="size-5" />
                  <span>The CampusOS Way</span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span>1 quiet, searchable OS dashboard organized by subject & semester</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span>Auto-synced VTU/Autonomous schemes with unit-by-unit tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span>Predictive 75% attendance radar & automated CIE score targeter</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span>Vetted 3rd/4th-year senior playbooks & viva question repositories</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CAMPUSOS SECTION */}
      <section id="why" className="py-24 relative z-10 border-t border-white/10 bg-gradient-to-b from-[#08090e] to-[#0f111d]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
                Why CampusOS Exists
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl leading-tight">
                Students do not need more information. They need a system.
              </h2>
              <p className="text-base text-gray-300 leading-relaxed">
                Engineering in Karnataka is fast-paced. Between IA tests, lab submissions, attendance cutoffs, and skill building, students waste hundreds of hours filtering noise. CampusOS brings clarity so you can focus on building your future.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-2xl font-bold text-purple-400">100%</div>
                  <div className="text-xs text-gray-400 mt-1">Karnataka College Alignment</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-2xl font-bold text-cyan-400">0 Spam</div>
                  <div className="text-xs text-gray-400 mt-1">Verified Information Signal</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 rounded-2xl border border-white/15 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-xl space-y-4">
              <h3 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h3>

              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border-b border-white/10 pb-4 transition"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between text-left text-sm font-semibold text-white hover:text-purple-300 transition cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`size-4 text-purple-400 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="mt-3 text-xs sm:text-sm text-gray-400 leading-relaxed">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION & WAITLIST FORM */}
      <section id="cta" className="py-24 relative z-10 border-t border-white/10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-b from-purple-950/40 via-[#0f111d] to-[#08090e] p-8 sm:p-12 text-center shadow-2xl backdrop-blur-2xl">
            {/* Glow Orb */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 size-72 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />

            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 px-3.5 py-1 text-xs font-semibold text-purple-300 border border-purple-500/30 mb-6">
              <Sparkles className="size-3.5" />
              Limited First-Year Cohort
            </span>

            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl leading-tight">
              Get your CampusOS early access pass.
            </h2>
            <p className="mt-4 text-base text-gray-300 max-w-2xl mx-auto">
              Join 2,400+ first-year engineering students across VTU and Autonomous colleges in Karnataka. Reserve your spot for the 2025/26 academic semester release.
            </p>

            {submitted ? (
              <div className="mt-8 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-center space-y-2 max-w-md mx-auto">
                <div className="size-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-white">You&apos;re on the early access list!</h3>
                <p className="text-xs text-gray-300">
                  We sent a confirmation pass to <strong className="text-emerald-300">{email}</strong>. We&apos;ll notify you as soon as your college workspace goes live!
                </p>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="mt-8 max-w-xl mx-auto space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Select College</label>
                    <select
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      required
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-gray-200 focus:border-purple-500 focus:outline-none"
                    >
                      <option value="">Choose College...</option>
                      {karnatakaColleges.map((c, i) => (
                        <option key={i} value={c} className="bg-gray-900 text-gray-200">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Select Branch</label>
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      required
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-gray-200 focus:border-purple-500 focus:outline-none"
                    >
                      <option value="">Choose Branch...</option>
                      {engineeringBranches.map((b, i) => (
                        <option key={i} value={b} className="bg-gray-900 text-gray-200">
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Student Email Address</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usn@college.ac.in or personal email"
                      required
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="shrink-0 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:from-purple-500 hover:to-indigo-500 cursor-pointer"
                    >
                      Reserve Access
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 text-center">
                  🔒 No spam ever. Free access for all Karnataka engineering students.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#06070a] py-12 relative z-10 text-xs text-gray-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-600 font-bold text-white text-xs">
              CO
            </div>
            <span className="font-bold text-white text-sm">CampusOS</span>
            <span className="text-gray-500">| The Student OS for Karnataka Engineering</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#simulator" className="hover:text-white transition">Simulator</a>
            <a href="#journey" className="hover:text-white transition">Journey</a>
            <a href="#why" className="hover:text-white transition">Why Us</a>
          </div>

          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
            <span className="text-gray-300">VTU 2025 & Autonomous Ready</span>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 border-t border-white/5 pt-6 text-center text-gray-500">
          © {new Date().getFullYear()} CampusOS Technologies. Built specifically for VTU & Autonomous engineering students across Karnataka.
        </div>
      </footer>
    </main>
  );
}
