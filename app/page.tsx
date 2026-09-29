/**
 * @file app/page.tsx
 * @description CampusLit Mission Control & Interactive Student Operating System.
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
  X,
  ExternalLink,
  FileText,
  GraduationCap,
  Award,
} from "lucide-react";
import {
  getAcademicResourcesForCourse,
  getCatalogSemesters,
  getCatalogCoursesBySemester,
} from "@/lib/academic-resources";
import {
  resolveSubjectResources,
  VTU_GENERAL_OFFICIAL_RESOURCES,
  sortResourcesByLanguage,
  ROADMAP_NODE_RESOURCES,
  DSA_PRACTICE_TOPICS,
  PROOF_OF_WORK_PROJECTS,
  INDUSTRY_CERTIFICATIONS,
  VerifiedResource,
} from "@/lib/resource-engine";

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
    q: "Is CampusLit tailored for both VTU affiliated and Autonomous colleges?",
    a: "Yes! CampusLit supports VTU 2022 and 2025 schemes as well as autonomous college credit structures (e.g. RVCE, PES, BMSCE, MSRIT). You can customize your syllabus, CIE rules, and grading scale during setup.",
  },
  {
    q: "How does CampusLit solve the WhatsApp & Telegram information clutter?",
    a: "Instead of searching through 400+ forwarded WhatsApp messages, CampusLit aggregates verified notices, lab records, notes, and exam schedules into clean, searchable cards organized by subject and semester.",
  },
  {
    q: "Is CampusLit free for engineering students?",
    a: "Yes, the core CampusLit workspace (Syllabus Engine, CIE Tracker, Attendance Radar, and Basic Senior Playbooks) is free for students across semesters 1–8 throughout their engineering journey.",
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

  // Semester Segregation State (Defaults to student's profile semester, or Sem 1)
  const [selectedSemester, setSelectedSemester] = useState<number>(profile?.semester || 1);

  // Custom User-Added Subjects (Personalized on-the-fly)
  const [customCourses, setCustomCourses] = useState<
    { courseId: number; courseName: string; courseCode: string; semester: number; branch: string }[]
  >([]);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [newSubjectSemester, setNewSubjectSemester] = useState<number>(profile?.semester || 1);

  // Sync selectedSemester when profile loads
  useEffect(() => {
    if (profile?.semester && typeof profile.semester === "number") {
      setSelectedSemester(profile.semester);
      setNewSubjectSemester(profile.semester);
    }
  }, [profile?.semester]);

  // Load any previously added custom subjects from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("campuslit_custom_subjects");
      if (stored) {
        setCustomCourses(JSON.parse(stored));
      }
    } catch {
      // Ignored
    }
  }, []);

  // Quick Attendance Logger Modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [logCourseId, setLogCourseId] = useState<number>(1);
  const [logStatus, setLogStatus] = useState<"present" | "absent" | "late">("present");
  const [logLoading, setLogLoading] = useState(false);
  const [logSuccessMessage, setLogSuccessMessage] = useState<string | null>(null);

  // Quick CIE Marks Logger Modal
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [markCourseId, setMarkCourseId] = useState<number>(1);
  const [markAssessmentsList, setMarkAssessmentsList] = useState<{ cieId: number; assessmentName: string; maxMarks: number }[]>([]);
  const [selectedCieId, setSelectedCieId] = useState<number | null>(null);
  const [markObtained, setMarkObtained] = useState<string>("35");
  const [markLoading, setMarkLoading] = useState(false);
  const [markSuccessMessage, setMarkSuccessMessage] = useState<string | null>(null);
  const [markErrorMessage, setMarkErrorMessage] = useState<string | null>(null);

  // Simulator State
  const [simAttendance, setSimAttendance] = useState<number>(82);
  const [targetSGPA, setTargetSGPA] = useState<number>(8.5);

  // Resource Intelligence & Language State
  const [preferredLanguage, setPreferredLanguage] = useState<"kannada" | "english" | "hindi">("english");
  const [expandedNodeKey, setExpandedNodeKey] = useState<string | null>("sde_01");

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
              setMarkCourseId(attJson.data[0].courseId);
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
              setMarkCourseId(courseJson.data[0].courseId);
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

        // 5. Fetch Settings for Preferred Language
        const settingsRes = await fetch("/api/settings", { credentials: "include" });
        if (settingsRes.ok) {
          const settingsJson = await settingsRes.json();
          if (settingsJson.data?.language) {
            setPreferredLanguage(settingsJson.data.language);
          }
        }
      } catch {
        // Fallback to demo mode
      }
    };

    fetchDashboardData();
  }, [isAuthenticated]);

  // Sync targetSGPA simulator from authenticated student profile if persisted
  useEffect(() => {
    if (profile?.targetSgpa !== null && profile?.targetSgpa !== undefined) {
      setTargetSGPA(Number(profile.targetSgpa));
    }
  }, [profile?.targetSgpa]);

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

  // Fetch course CIE assessments when mark modal opens or course selection changes
  useEffect(() => {
    if (!showMarkModal || !markCourseId) return;

    const fetchCieAssessments = async () => {
      try {
        const res = await fetch(`/api/assessments/cie?courseId=${markCourseId}`, { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setMarkAssessmentsList(json.data);
            if (json.data.length > 0) {
              setSelectedCieId(json.data[0].cieId);
            } else {
              setSelectedCieId(null);
            }
          }
        }
      } catch {
        // Fallback gracefully
      }
    };

    fetchCieAssessments();
  }, [showMarkModal, markCourseId]);

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

  // Record CIE mark directly to backend
  const handleRecordMark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCieId) return;

    setMarkLoading(true);
    setMarkSuccessMessage(null);
    setMarkErrorMessage(null);

    try {
      const res = await fetch("/api/assessments/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          cieId: selectedCieId,
          marksObtained: Number(markObtained),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setMarkSuccessMessage("CIE Mark recorded successfully!");
        // Refresh marks
        const marksRes = await fetch("/api/assessments/marks", { credentials: "include" });
        if (marksRes.ok) {
          const marksJson = await marksRes.json();
          if (marksJson.success && Array.isArray(marksJson.data)) {
            setCieMarks(marksJson.data);
          }
        }
        setTimeout(() => {
          setShowMarkModal(false);
          setMarkSuccessMessage(null);
        }, 1200);
      } else {
        setMarkErrorMessage(json.message || "Failed to record mark.");
      }
    } catch {
      setMarkErrorMessage("Network error while recording mark.");
    } finally {
      setMarkLoading(false);
    }
  };

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  // Calculate live aggregate attendance (strictly honest: null when 0 records)
  const totalClassesAggregate = attendanceSummaries.reduce((sum, item) => sum + item.totalClasses, 0);
  const attendedClassesAggregate = attendanceSummaries.reduce((sum, item) => sum + item.attendedClasses, 0);
  const hasAttendanceRecords = attendanceSummaries.length > 0 && totalClassesAggregate > 0;
  const liveAttendancePct =
    hasAttendanceRecords
      ? parseFloat(((attendedClassesAggregate / totalClassesAggregate) * 100).toFixed(1))
      : null;

  // Real 75% Bunk Defense calculation (strictly honest: null when 0 records)
  const liveSafeBunks =
    hasAttendanceRecords
      ? Math.max(0, Math.floor(attendedClassesAggregate / 0.75 - totalClassesAggregate))
      : null;

  // Real CIE Marks & SGPA calculation (strictly honest: null when 0 records)
  const hasCieRecords = cieMarks.length > 0;
  const projectedSgpa =
    hasCieRecords
      ? parseFloat((cieMarks.reduce((sum, m) => sum + (m.marksObtained / m.maxMarks) * 10, 0) / cieMarks.length).toFixed(2))
      : null;

  // Simulator outputs for prospective landing page demo
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
                ? `Logged in as ${profile.firstName} • ${profile.semester ? `Semester ${profile.semester}` : "Engineering"} Workspace`
                : "Built for Engineering Students — from First Semester to Placements"}
            </span>
            <ChevronRight className="size-3.5 opacity-70" />
          </div>

          {/* Main Headline */}
          <h1 className="mx-auto max-w-5xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.08]">
            Your Engineering Degree,{" "}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              Without the Chaos.
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
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-8 text-base font-semibold text-gray-300 transition hover:bg-white/[0.08] hover:text-white sm:w-auto"
            >
              Explore Workspace
            </a>
          </div>

          {/* Proof / Verification Metrics Strip (Truthful Non-Fabricated Claims) */}
          <div className="mt-14 inline-flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-3.5 text-xs text-gray-400 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2 overflow-hidden">
                <div className="inline-block size-7 rounded-full bg-purple-600 ring-2 ring-[#08090e] text-[10px] font-bold flex items-center justify-center text-white">RV</div>
                <div className="inline-block size-7 rounded-full bg-indigo-600 ring-2 ring-[#08090e] text-[10px] font-bold flex items-center justify-center text-white">BMS</div>
                <div className="inline-block size-7 rounded-full bg-cyan-600 ring-2 ring-[#08090e] text-[10px] font-bold flex items-center justify-center text-white">PES</div>
                <div className="inline-block size-7 rounded-full bg-emerald-600 ring-2 ring-[#08090e] text-[10px] font-bold flex items-center justify-center text-white">MSR</div>
              </div>
              <div>
                <span className="font-semibold text-white">Active Student Workspace</span> for Karnataka
              </div>
            </div>

            <div className="h-4 w-px bg-white/10 hidden sm:block" />

            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-purple-400" />
              <span><strong className="text-white">VTU & Autonomous Curriculum</strong> integrated</span>
            </div>

            <div className="h-4 w-px bg-white/10 hidden sm:block" />

            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-400" />
              <span><strong className="text-white">Full Sem 1–8 Coverage</strong> with AI Senior Mentor</span>
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
              Click through the tabs below to test how CampusLit organizes academics, attendance, viva playbooks, and tech skills.
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
                  CampusLit v1.0.4 — [{profile?.semester ? `Semester ${profile.semester} Engineering Workspace` : "Engineering Workspace"}]
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-xs text-gray-400">
                <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-1 rounded-full font-medium">
                  Start your CampusLit journey 🔥
                </span>
                {hasAttendanceRecords ? (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Attendance: {liveAttendancePct}% {liveAttendancePct! >= 75 ? "Safe" : "Warning"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-white/[0.04] text-gray-400 px-2.5 py-1 rounded-full border border-white/10 font-medium">
                    Attendance: Not recorded yet
                  </span>
                )}
                <span className="bg-white/[0.06] px-2.5 py-1 rounded-md text-gray-300">
                  {hasCieRecords ? `Projected: ${projectedSgpa} SGPA` : "SGPA: Not recorded yet"}
                </span>
              </div>
            </div>

            {/* Main Window Dashboard Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-2 sm:p-4 text-left">
              {/* Sidebar (4 Cols) */}
              <aside className="lg:col-span-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
                  <span>VTU Curriculum</span>
                  <span className="text-purple-400 text-[11px] font-mono">
                    Sem {selectedSemester}
                  </span>
                </div>

                {/* Semester Selector Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar border-b border-white/10">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                    const isSelected = selectedSemester === sem;
                    const isStudentSem = profile?.semester === sem;
                    return (
                      <button
                        key={sem}
                        type="button"
                        onClick={() => {
                          setSelectedSemester(sem);
                          // Auto select the first subject of the newly chosen semester
                          const semSubjects = getCatalogCoursesBySemester(sem);
                          if (semSubjects.length > 0) {
                            setSelectedCourseId(semSubjects[0].courseId);
                          }
                        }}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold transition shrink-0 cursor-pointer ${
                          isSelected
                            ? "bg-purple-600 text-white shadow-sm"
                            : "bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08]"
                        }`}
                      >
                        S{sem}
                        {isStudentSem && <span className="ml-0.5 text-[9px] text-purple-200">★</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Course List for Selected Semester */}
                {(() => {
                  const catalogForSem = getCatalogCoursesBySemester(selectedSemester);
                  // Match database courses or use the catalog for the selected semester
                  const displaySubjects = [
                    ...catalogForSem.map((cat) => {
                      const dbMatch = courses.find((c) => c.courseCode?.toUpperCase() === cat.courseCode.toUpperCase());
                      return {
                        courseId: dbMatch?.courseId || cat.courseId,
                        courseName: cat.courseName,
                        courseCode: cat.courseCode,
                        branch: cat.branch,
                        isCustom: false,
                      };
                    }),
                    // Include any custom subjects entered by student for this semester
                    ...customCourses
                      .filter((cc) => cc.semester === selectedSemester)
                      .map((cc) => ({
                        courseId: cc.courseId,
                        courseName: cc.courseName,
                        courseCode: cc.courseCode,
                        branch: cc.branch,
                        isCustom: true,
                      })),
                  ];

                  return (
                    <div className="space-y-1 text-xs overflow-y-auto max-h-[360px] pr-1">
                      {displaySubjects.length > 0 ? (
                        displaySubjects.map((c) => {
                          const isSelected = selectedCourseId === c.courseId;
                          return (
                            <div
                              key={c.courseId}
                              onClick={() => setSelectedCourseId(c.courseId)}
                              className={`flex items-center justify-between rounded-lg px-2.5 py-2 cursor-pointer transition ${
                                isSelected
                                  ? "bg-purple-500/15 border border-purple-500/30 text-white font-medium"
                                  : "bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]"
                              }`}
                            >
                              <span className="flex items-center gap-2 truncate">
                                <BookOpen className="size-3.5 text-purple-400 shrink-0" />
                                <span className="truncate">{c.courseName}</span>
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {c.isCustom && (
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded font-mono">
                                    Custom
                                  </span>
                                )}
                                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono">
                                  {c.courseCode || "VTU"}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-3 text-center text-gray-500 text-xs">
                          No subjects registered for Semester {selectedSemester}.
                        </div>
                      )}

                      {/* Add Custom Subject Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setNewSubjectSemester(selectedSemester);
                          setShowAddSubjectModal(true);
                        }}
                        className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-dashed border-purple-500/30 bg-purple-500/[0.04] text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/60 transition text-xs font-semibold cursor-pointer"
                      >
                        <Plus className="size-3.5 text-purple-400" />
                        <span>Add Subject / Elective</span>
                      </button>
                    </div>
                  );
                })()}

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
                {activeTab === "academics" && (() => {
                  const catalogForSem = getCatalogCoursesBySemester(selectedSemester);
                  const selectedCourseObj =
                    courses.find((c) => c.courseId === selectedCourseId) ||
                    catalogForSem.find((c) => c.courseId === selectedCourseId) ||
                    customCourses.find((c) => c.courseId === selectedCourseId) ||
                    customCourses.filter((c) => c.semester === selectedSemester)[0] ||
                    catalogForSem[0] ||
                    courses[0] || {
                      courseId: 1,
                      courseName: "Mathematics for CSE Stream-I",
                      courseCode: "BMATS101",
                    };
                  const academicData = getAcademicResourcesForCourse(selectedCourseObj);
                  const subjectIntelligence = resolveSubjectResources(
                    selectedCourseObj.courseCode,
                    selectedCourseObj.courseName
                  );

                  // Extract verified resources and sort by language
                  const allSubjectResources: VerifiedResource[] = subjectIntelligence?.resources || [];
                  const languageSortedData = sortResourcesByLanguage(allSubjectResources, preferredLanguage);
                  const effectiveResources = languageSortedData.sortedResources;

                  // Extract Exam Prep resources (PYQ, Model Papers, CIE prep)
                  const examPrepItems: VerifiedResource[] = (subjectIntelligence?.resources || []).filter(
                    (r: VerifiedResource) =>
                      r.category === "pyq" ||
                      r.category === "model_papers" ||
                      r.category === "question_banks" ||
                      r.category === "syllabus"
                  );

                  return (
                    <div className="space-y-6">
                      {/* Course Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                              Academic Playbook & Syllabus Hub
                            </span>
                            <span className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded font-mono">
                              {selectedCourseObj.courseCode || academicData?.courseCode || "VTU"}
                            </span>
                          </div>
                          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                            {selectedCourseObj.courseName}
                          </h3>
                          <p className="text-xs text-gray-400">
                            {subjectIntelligence?.scheme || academicData?.scheme || "VTU 2022 Scheme"} • {subjectIntelligence?.branch || academicData?.branch || "Engineering Curriculum"} • {subjectIntelligence?.credits ? `${subjectIntelligence.credits} Credits` : "4 Credits"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {hasCieRecords ? (
                            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full font-medium">
                              IA Target: 36/40
                            </span>
                          ) : (
                            <button
                              onClick={() => setShowMarkModal(true)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-purple-600/30 transition cursor-pointer"
                            >
                              <Plus className="size-3.5" />
                              <span>Add CIE Marks</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* CIE Performance Section */}
                      {hasCieRecords ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                            <span className="text-xs text-gray-400">Current CIE Marks</span>
                            <p className="text-xl font-bold text-white mt-1">
                              {`${cieMarks[0].marksObtained} / ${cieMarks[0].maxMarks}`}
                            </p>
                            <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                              <CheckCircle2 className="size-3" /> {cieMarks[0].assessmentName || "CIE Recorded"}
                            </span>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                            <span className="text-xs text-gray-400">VTU Exam Weightage</span>
                            <p className="text-xl font-bold text-purple-400 mt-1">50% CIE + 50% SEE</p>
                            <span className="text-[11px] text-gray-400 mt-1 block">Pass Cutoff: 40%</span>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                            <span className="text-xs text-gray-400">Projected SGPA</span>
                            <p className="text-xl font-bold text-cyan-400 mt-1">{projectedSgpa} SGPA</p>
                            <span className="text-[11px] text-cyan-300 mt-1 block">Based on recorded marks</span>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center space-y-3">
                          <div className="size-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
                            <BookOpen className="size-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">CIE Performance</h4>
                            <p className="text-xs text-purple-300 font-semibold mt-0.5">No marks recorded yet</p>
                            <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto leading-relaxed">
                              Add your assessment marks to track CIE performance and projected academic outcomes.
                            </p>
                          </div>
                          <div className="pt-1">
                            <button
                              onClick={() => setShowMarkModal(true)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-purple-600/30 transition cursor-pointer"
                            >
                              <Plus className="size-3.5" />
                              <span>Add CIE Marks</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* SECTION 2: LANGUAGE-AWARE SUBJECT ACADEMIC RESOURCE HUB */}
                      <div className="space-y-4 pt-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                              <BookOpen className="size-3.5 text-purple-400" />
                              Subject Academic Resource Hub
                            </h4>
                            <p className="text-[11px] text-gray-500">
                              Verified syllabus, notes, lectures, question banks, and reference materials
                            </p>
                          </div>

                          {/* Language selector (P6) */}
                          <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/10 text-xs self-start sm:self-auto">
                            <span className="text-[10px] text-gray-400 px-2 font-medium">Language:</span>
                            {(["english", "kannada", "hindi"] as const).map((lang) => (
                              <button
                                key={lang}
                                onClick={() => setPreferredLanguage(lang)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer capitalize ${
                                  preferredLanguage === lang
                                    ? "bg-purple-600 text-white shadow-sm"
                                    : "text-gray-400 hover:text-white"
                                }`}
                              >
                                {lang}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Language Fallback Notice (P6) */}
                        {languageSortedData.fallbackMessage && (
                          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-300 flex items-center gap-2">
                            <AlertTriangle className="size-4 shrink-0 text-amber-400" />
                            <span>{languageSortedData.fallbackMessage}</span>
                          </div>
                        )}

                        {/* Resource Grid (P3) */}
                        {effectiveResources.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {effectiveResources.map((res) => (
                              <div
                                key={res.resourceId}
                                className="group rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col justify-between hover:border-purple-500/30 hover:bg-white/[0.05] transition-all"
                              >
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                                      {res.category.replace("_", " ")}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      {res.language && (
                                        <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded capitalize">
                                          {res.language}
                                        </span>
                                      )}
                                      <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                                        {res.free ? "Free" : "Subscription"}
                                      </span>
                                    </div>
                                  </div>
                                  <h5 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors leading-snug">
                                    {res.title}
                                  </h5>
                                  <p className="text-[11px] text-gray-400 leading-relaxed">
                                    <span className="text-gray-500">Provider:</span> {res.provider}
                                    {res.description ? ` • ${res.description}` : ""}
                                  </p>
                                </div>
                                <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between">
                                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                                    <Check className="size-3" /> Verified {res.lastVerifiedAt}
                                  </span>
                                  <a
                                    href={res.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 transition cursor-pointer"
                                  >
                                    <span>Access Material</span>
                                    <ExternalLink className="size-3" />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center space-y-2">
                            <div className="size-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
                              <BookOpen className="size-5" />
                            </div>
                            <h5 className="text-sm font-bold text-white">Verified resource not available yet.</h5>
                            <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                              Verified resources for {selectedCourseObj.courseName} are being actively curated by Karnataka senior scholars.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* SECTION 3: EXAM PREPARATION (P5) */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                              <GraduationCap className="size-3.5 text-purple-400" />
                              Exam Preparation & PYQ Intelligence
                            </h4>
                            <p className="text-[11px] text-gray-500">
                              Previous year questions, model papers, question banks, and make-up exam links
                            </p>
                          </div>
                        </div>

                        {examPrepItems.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {examPrepItems.map((ep: VerifiedResource, idx: number) => (
                              <div
                                key={idx}
                                className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col justify-between hover:border-purple-500/30 transition"
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                                      {ep.category.replace("_", " ")}
                                    </span>
                                    <span className="text-[10px] font-mono text-gray-400">VTU Exam</span>
                                  </div>
                                  <h5 className="text-sm font-bold text-white leading-snug">{ep.title}</h5>
                                  <p className="text-[11px] text-gray-400">{ep.provider}</p>
                                </div>
                                <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between">
                                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                                    <Check className="size-3" /> Verified {ep.lastVerifiedAt}
                                  </span>
                                  <a
                                    href={ep.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 transition cursor-pointer"
                                  >
                                    <span>Access Exam Paper</span>
                                    <ExternalLink className="size-3" />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center">
                            <span className="text-xs text-gray-400">Verified resource not available yet.</span>
                          </div>
                        )}
                      </div>

                      {/* SECTION 4: VTU ACADEMIC INTELLIGENCE (P4) */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Building2 className="size-3.5 text-purple-400" />
                              VTU Official Academic Portals & Circulars
                            </h4>
                            <p className="text-[11px] text-gray-500">
                              Direct links to official Visvesvaraya Technological University examination & syllabus records
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {VTU_GENERAL_OFFICIAL_RESOURCES.map((vtuRes) => (
                            <a
                              key={vtuRes.resourceId}
                              href={vtuRes.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 hover:border-purple-500/40 hover:bg-white/[0.05] transition flex flex-col justify-between space-y-2 group"
                            >
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">
                                  Official VTU
                                </span>
                                <h6 className="text-xs font-bold text-white group-hover:text-purple-300 transition">
                                  {vtuRes.title}
                                </h6>
                                <p className="text-[10px] text-gray-400 line-clamp-2">{vtuRes.description}</p>
                              </div>
                              <span className="text-[11px] text-purple-400 font-semibold flex items-center gap-1 pt-1">
                                Open Portal <ExternalLink className="size-3" />
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>

                      {/* SECTION 3: MODULE SYLLABUS & HIGH-FREQUENCY EXAM PATTERNS */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                              Module Syllabus & High-Frequency Exam Patterns
                            </h4>
                            <p className="text-[11px] text-gray-500">Observed recurrent university exam questions mapped to modules</p>
                          </div>
                          {academicData?.highFrequencyQuestions && academicData.highFrequencyQuestions.length > 0 && (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                              {academicData.highFrequencyQuestions.length} Analyzed Patterns
                            </span>
                          )}
                        </div>

                        {academicData?.highFrequencyQuestions && academicData.highFrequencyQuestions.length > 0 ? (
                          <div className="space-y-2.5">
                            {academicData.highFrequencyQuestions.map((q) => (
                              <div
                                key={q.questionId}
                                className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/20 transition"
                              >
                                <div className="flex items-start sm:items-center gap-3">
                                  <div className="size-8 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                                    M{q.module}
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs sm:text-sm font-semibold text-white leading-snug">
                                      {q.question}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400">
                                      <span className="text-purple-300 font-medium">{q.classification}</span>
                                      <span>•</span>
                                      <span>{q.typicalMarks} Marks</span>
                                      <span>•</span>
                                      <span>Appeared in {q.occurrenceCount}/{q.papersAnalyzed} Papers</span>
                                    </div>
                                  </div>
                                </div>
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold shrink-0 self-start sm:self-auto">
                                  High Probability
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center space-y-2">
                            <p className="text-sm font-semibold text-gray-300">
                              Module-level syllabus is not yet available for this subject.
                            </p>
                            <p className="text-xs text-gray-500 max-w-md mx-auto">
                              Curriculum modules and high-frequency exam questions for {selectedCourseObj.courseName} are being compiled.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

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

                    {hasAttendanceRecords ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Overall Attendance</span>
                              <span className={`font-bold ${liveAttendancePct! >= 75 ? "text-emerald-400" : "text-rose-400"}`}>
                                {liveAttendancePct}%
                              </span>
                            </div>
                            <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  liveAttendancePct! >= 75
                                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                    : "bg-gradient-to-r from-rose-500 to-amber-500"
                                }`}
                                style={{ width: `${Math.min(100, liveAttendancePct!)}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-400">
                              Total Classes: <strong className="text-white">{totalClassesAggregate}</strong> | Attended: <strong className="text-white">{attendedClassesAggregate}</strong>
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col justify-between">
                            <div>
                              <span className="text-xs text-gray-400">Calculated Safe Bunks</span>
                              <p className={`text-2xl font-bold mt-1 ${liveSafeBunks! > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                {liveSafeBunks! > 0 ? `${liveSafeBunks} Classes Buffer` : "0 Classes (At Cutoff!)"}
                              </p>
                            </div>
                            <p className="text-xs text-gray-400">
                              {liveSafeBunks! > 0
                                ? `You can safely miss ${liveSafeBunks} classes without dipping below 75%.`
                                : "Must attend upcoming lectures to avoid detention lists."}
                            </p>
                          </div>
                        </div>

                        {/* Course Attendance List */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Subject Attendance Radar</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {attendanceSummaries.map((s, idx) => (
                              <div
                                key={s.summaryId || idx}
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
                      </>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center space-y-4">
                        <div className="size-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                          <ShieldCheck className="size-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-base font-bold text-white">Attendance Not Recorded Yet</h4>
                          <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                            Start logging your classes to see attendance percentage, attendance risk, and safe-bunk calculations.
                          </p>
                        </div>
                        <div>
                          <button
                            onClick={() => setShowLogModal(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/30 transition cursor-pointer"
                          >
                            <Plus className="size-4" />
                            <span>Log Attendance</span>
                          </button>
                        </div>
                      </div>
                    )}
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

                    {/* MILESTONE CARDS WITH EXPANDABLE RESOURCE DRAWERS */}
                    <div className="space-y-3">
                      {[
                        { key: "sde_01", num: "01", title: "Git, GitHub & Linux Command Line", desc: "Create GitHub profile, commit lab codes, learn basic bash", color: "emerald" },
                        { key: "sde_02", num: "02", title: "Data Structures in C / C++ Starter", desc: "Arrays, Pointers, Linked Lists & 25 LeetCode Easy problems", color: "blue" },
                        { key: "sde_03", num: "03", title: "First Hackathon & Full-Stack Basics", desc: "Build a mini-project for college tech fest (IEEE / GDSC)", color: "purple" },
                      ].map((item) => {
                        const drawer = ROADMAP_NODE_RESOURCES[item.key];
                        const isExpanded = expandedNodeKey === item.key;
                        return (
                          <div
                            key={item.key}
                            className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden transition"
                          >
                            <div
                              onClick={() => setExpandedNodeKey(isExpanded ? null : item.key)}
                              className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-white/[0.04] transition"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`size-8 rounded-lg bg-${item.color}-500/20 text-${item.color}-400 flex items-center justify-center font-bold text-xs`}>
                                  {item.num}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-white">{item.title}</p>
                                  <p className="text-xs text-gray-400">{item.desc}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-purple-400 hover:text-purple-300">
                                  {isExpanded ? "Hide Resources" : "Where to Learn"}
                                </span>
                                <ChevronDown className={`size-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                              </div>
                            </div>

                            {/* EXPANDABLE RESOURCE DRAWER */}
                            {isExpanded && drawer && (
                              <div className="p-4 bg-black/40 border-t border-white/10 space-y-4 text-xs">
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block mb-1">
                                    Concept Overview
                                  </span>
                                  <p className="text-gray-300 leading-relaxed">{drawer.conceptOverview}</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {/* Official Docs & Free Courses */}
                                  <div className="space-y-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                                      Official Docs & Free Courses
                                    </span>
                                    {[...(drawer.officialDocs || []), ...(drawer.freeCourses || [])].map((d) => (
                                      <a
                                        key={d.resourceId}
                                        href={d.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-2.5 rounded-xl border border-white/10 bg-white/[0.02] hover:border-purple-500/40 hover:bg-white/[0.05] transition text-gray-300"
                                      >
                                        <span className="truncate pr-2">{d.title}</span>
                                        <ExternalLink className="size-3 text-purple-400 shrink-0" />
                                      </a>
                                    ))}
                                  </div>

                                  {/* Practice & YouTube */}
                                  <div className="space-y-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                                      Practice Platform & YouTube
                                    </span>
                                    {drawer.practice?.map((pr) => (
                                      <a
                                        key={pr.resourceId}
                                        href={pr.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-2.5 rounded-xl border border-white/10 bg-white/[0.02] hover:border-purple-500/40 hover:bg-white/[0.05] transition text-gray-300"
                                      >
                                        <span className="truncate pr-2">{pr.title}</span>
                                        <ExternalLink className="size-3 text-emerald-400 shrink-0" />
                                      </a>
                                    ))}
                                    {drawer.youtube?.english?.map((yt) => (
                                      <a
                                        key={yt.resourceId}
                                        href={yt.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-2.5 rounded-xl border border-white/10 bg-white/[0.02] hover:border-purple-500/40 hover:bg-white/[0.05] transition text-gray-300"
                                      >
                                        <span className="truncate pr-2">{yt.title}</span>
                                        <ExternalLink className="size-3 text-rose-400 shrink-0" />
                                      </a>
                                    ))}
                                  </div>
                                </div>

                                {/* Proof-of-Work Checklist */}
                                {drawer.proofOfWorkChecklist && drawer.proofOfWorkChecklist.length > 0 && (
                                  <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block">
                                      Proof-of-Work Checklist
                                    </span>
                                    <ul className="space-y-1 text-gray-300">
                                      {drawer.proofOfWorkChecklist.map((chk, cIdx) => (
                                        <li key={cIdx} className="flex items-center gap-2">
                                          <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                                          <span>{chk}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* DSA PRACTICE PREVIEW (P8) */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Code className="size-3.5 text-purple-400" />
                          Actionable DSA Topic Practice
                        </h4>
                        <Link href="/roadmap" className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold">
                          View All Topics →
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {DSA_PRACTICE_TOPICS.map((topic) => (
                          <div
                            key={topic.topicKey}
                            className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3 flex flex-col justify-between"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-white">{topic.topicName}</span>
                                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-bold">
                                  {topic.difficulty}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400">
                                Learn: {topic.learn.conceptDoc.title} ({topic.learn.conceptDoc.provider})
                              </p>
                            </div>

                            <div className="space-y-1.5 pt-2 border-t border-white/5">
                              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                                Practice Problems:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {topic.practice.map((p, pIdx) => (
                                  <a
                                    key={pIdx}
                                    href={p.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 px-2 py-1 rounded-lg transition"
                                  >
                                    <span>{p.title.split("(")[0]}</span>
                                    <ExternalLink className="size-2.5 text-purple-400" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* INDUSTRY CERTIFICATIONS PREVIEW (P10) */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Award className="size-3.5 text-purple-400" />
                          Industry & Academic Certifications
                        </h4>
                        <Link href="/roadmap" className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold">
                          View Catalog →
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {INDUSTRY_CERTIFICATIONS.slice(0, 4).map((c) => (
                          <div
                            key={c.certId}
                            className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex flex-col justify-between space-y-2 hover:border-purple-500/30 transition"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                                  {c.domain.replace("_", " ")}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono">
                                  {c.examType === "free_certificate" ? "Free Cert" : "Exam Voucher"}
                                </span>
                              </div>
                              <h5 className="text-xs sm:text-sm font-bold text-white">{c.title}</h5>
                              <p className="text-[11px] text-gray-400">{c.provider} • {c.level}</p>
                            </div>
                            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                              <span className="text-[10px] text-emerald-400 font-semibold">
                                {c.studentDiscountAvailable ? "Student Eligibility Verified" : "Open Access"}
                              </span>
                              <a
                                href={c.officialUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-400 hover:text-purple-300 transition cursor-pointer"
                              >
                                <span>Official Portal</span>
                                <ExternalLink className="size-3" />
                              </a>
                            </div>
                          </div>
                        ))}
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

      {/* QUICK CIE MARKS LOGGER MODAL */}
      {showMarkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-purple-500/30 bg-[#0d0f18] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="size-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Record CIE Marks</h3>
              </div>
              <button
                onClick={() => setShowMarkModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {markSuccessMessage ? (
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-center space-y-2">
                <CheckCircle2 className="size-8 text-purple-400 mx-auto" />
                <p className="text-xs font-bold text-purple-300">{markSuccessMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleRecordMark} className="space-y-4">
                {markErrorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                    {markErrorMessage}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Select Course</label>
                  <select
                    value={markCourseId}
                    onChange={(e) => setMarkCourseId(Number(e.target.value))}
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
                  <label className="block text-xs font-medium text-gray-300 mb-1">Select Assessment</label>
                  {markAssessmentsList.length > 0 ? (
                    <select
                      value={selectedCieId || ""}
                      onChange={(e) => setSelectedCieId(Number(e.target.value))}
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                    >
                      {markAssessmentsList.map((a) => (
                        <option key={a.cieId} value={a.cieId} className="bg-gray-900 text-gray-200">
                          {a.assessmentName} (Max: {a.maxMarks})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5">
                      No CIE assessments registered for this course yet. Please check back after curriculum setup.
                    </p>
                  )}
                </div>

                {markAssessmentsList.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Marks Obtained</label>
                    <input
                      type="number"
                      min={0}
                      max={markAssessmentsList.find((a) => a.cieId === selectedCieId)?.maxMarks || 50}
                      value={markObtained}
                      onChange={(e) => setMarkObtained(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                      required
                    />
                  </div>
                )}

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowMarkModal(false)}
                    className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-bold text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={markLoading || !selectedCieId}
                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition disabled:opacity-50 cursor-pointer"
                  >
                    {markLoading ? "Saving..." : "Record Mark"}
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
                Test how CampusLit predicts your exam eligibility and calculates exact bunk allowances before your college posts detention notices.
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
              CampusLit guides you through every milestone from day one of college until placement season.
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
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Key CampusLit Deliverables</h4>
                {journeySteps[activeJourney].details.map((detail, dIdx) => (
                  <div key={dIdx} className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/30 p-3 text-sm text-gray-200">
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CHAOS VS CAMPUSLIT MATRIX */}
          <div className="mt-20 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 backdrop-blur-xl">
            <h3 className="text-xl font-bold text-white text-center mb-8">
              Why Students Switch from WhatsApp Groups to CampusLit
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

              {/* CampusLit Way Box */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="size-5" />
                  <span>The CampusLit Way</span>
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

      {/* WHY CAMPUSLIT SECTION */}
      <section id="why" className="py-24 relative z-10 border-t border-white/10 bg-gradient-to-b from-[#08090e] to-[#0f111d]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
                Why CampusLit Exists
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl leading-tight">
                Students do not need more information. They need a system.
              </h2>
              <p className="text-base text-gray-300 leading-relaxed">
                Engineering in Karnataka is fast-paced. Between IA tests, lab submissions, attendance cutoffs, and skill building, students waste hundreds of hours filtering noise. CampusLit brings clarity so you can focus on building your future.
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
              Engineering Student Access
            </span>

            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl leading-tight">
              Get your CampusLit early access pass.
            </h2>
            <p className="mt-4 text-base text-gray-300 max-w-2xl mx-auto">
              Built for Engineering Students — from First Semester to Placements. Reserve your spot for your branch and college workspace release.
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

      {/* ADD CUSTOM SUBJECT MODAL */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-purple-500/30 bg-[#0d0f18] p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowAddSubjectModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-purple-600/20 text-purple-400">
                <BookOpen className="size-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Add Custom Subject / Elective</h3>
                <p className="text-xs text-gray-400">
                  Instant notes, PYQs, and masterclasses will be synthesized automatically.
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newSubjectName.trim()) return;

                const newId = Date.now();
                const newCourse = {
                  courseId: newId,
                  courseName: newSubjectName.trim(),
                  courseCode: (newSubjectCode.trim() || "VTU-SPEC").toUpperCase(),
                  semester: newSubjectSemester,
                  branch: profile?.specializationBranch || "Engineering Stream",
                };

                const updated = [...customCourses, newCourse];
                setCustomCourses(updated);
                try {
                  localStorage.setItem("campuslit_custom_subjects", JSON.stringify(updated));
                } catch {
                  // Ignored
                }

                // Auto-switch to the new course and semester
                setSelectedSemester(newSubjectSemester);
                setSelectedCourseId(newId);
                setShowAddSubjectModal(false);
                setNewSubjectName("");
                setNewSubjectCode("");
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Subject / Course Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cloud Computing, Cyber Forensics, VLSI Design"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Course Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 21CS62 or BCS601"
                    value={newSubjectCode}
                    onChange={(e) => setNewSubjectCode(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Semester
                  </label>
                  <select
                    value={newSubjectSemester}
                    onChange={(e) => setNewSubjectSemester(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s} className="bg-gray-900 text-white">
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-200">
                ✨ <strong>Instant Intelligence</strong>: Once added, CampusLit will automatically synthesize curated VTU notes, PYQs, video masterclasses, and exam viva tips for this subject.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-600/30 transition cursor-pointer"
                >
                  Add Subject & Fetch Resources
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#06070a] py-12 relative z-10 text-xs text-gray-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-600 font-bold text-white text-xs">
              CL
            </div>
            <span className="font-bold text-white text-sm">CampusLit</span>
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
          © {new Date().getFullYear()} CampusLit Technologies. Built specifically for VTU & Autonomous engineering students across Karnataka.
        </div>
      </footer>
    </main>
  );
}
