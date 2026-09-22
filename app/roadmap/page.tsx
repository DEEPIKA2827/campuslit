/**
 * @file app/roadmap/page.tsx
 * @description Interactive Personalized Milestone Roadmap Hub for CampusOS.
 * @purpose Renders student's personalized curriculum tree from GET /api/roadmaps/personalized.
 *          Provides interactive specialization branch selection and authoritative progress tracking.
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import {
  PersonalizedRoadmapResponseDTO,
  PersonalizedRoadmapDTO,
  PersonalizedRoadmapNodeDTO,
  RoadmapStudentContextDTO,
  RoadmapNodeStatus,
} from "@/types/api.types";
import {
  Compass,
  CheckCircle2,
  Clock,
  Lock,
  Sparkles,
  Award,
  Code,
  FolderGit2,
  X,
  Check,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Cpu,
  Radio,
  Bot,
  GraduationCap,
  Globe2,
  Layers,
  ArrowRight,
  ExternalLink,
  Briefcase,
} from "lucide-react";
import {
  PROOF_OF_WORK_PROJECTS,
  DSA_PRACTICE_TOPICS,
  INDUSTRY_CERTIFICATIONS,
  getRoadmapNodeDrawer,
} from "@/lib/resource-engine";

// Canonical Career Display Mapping
const CAREER_LABELS: Record<string, string> = {
  sde: "Software Engineering (SDE)",
  ai_ml: "AI & Machine Learning",
  core: "Core Engineering",
  higher_ed: "Higher Studies",
  founder: "Startup Founder / Product Creator",
};

// Core Engineering Specialization Options
const CORE_SPECIALIZATION_OPTIONS = [
  {
    branch: "embedded",
    title: "Embedded Systems",
    subtitle: "Microcontroller Firmware & Hardware Interfacing",
    desc: "C/C++, ARM Cortex, FreeRTOS, GPIO/SPI/I2C protocols, and bare-metal firmware programming.",
    icon: Cpu,
  },
  {
    branch: "iot",
    title: "Internet of Things (IoT)",
    subtitle: "Connected Sensors & Cloud Ingestion Pipelines",
    desc: "ESP32, MQTT/CoAP telemetry, edge analytics, AWS/GCP IoT Core, and sensor network design.",
    icon: Radio,
  },
  {
    branch: "robotics",
    title: "Robotics & Automation",
    subtitle: "Actuators, Kinematics & Autonomous Control",
    desc: "ROS2, motor drivers, PID controllers, inverse kinematics, sensor fusion, and computer vision.",
    icon: Bot,
  },
];

// Higher Studies Specialization Options
const HIGHER_ED_SPECIALIZATION_OPTIONS = [
  {
    branch: "gate",
    title: "GATE Examination",
    subtitle: "Technical Mastery for PSU & M.Tech Admissions",
    desc: "Discrete Math, Algorithms, Computer Systems/Signals, Engineering Math, and PYQ mock test series.",
    icon: GraduationCap,
  },
  {
    branch: "ms",
    title: "Masters Abroad (MS)",
    subtitle: "Global University Applications & Research Profile",
    desc: "GRE/TOEFL preparation, statement of purpose (SOP), academic LORs, and research paper publications.",
    icon: Globe2,
  },
  {
    branch: "mba",
    title: "MBA / Management Entrance",
    subtitle: "Business Leadership & Entrance Examinations",
    desc: "CAT/GMAT quantitative aptitude, verbal ability, data interpretation (DILR), and case interviews.",
    icon: Briefcase,
  },
];

// Complementary Proof-of-Work Projects Data
const projectSpecs = [
  {
    id: "p1",
    title: "VTU SGPA & CIE Risk Calculator",
    level: "Beginner",
    techStack: ["C++", "Python", "File I/O"],
    desc: "Calculates SGPA/CGPA based on VTU credit scheme and predicts 75% attendance bunk allowances.",
    deliverables: ["CLI Executable", "GitHub Repository", "Sample Data Input File"],
  },
  {
    id: "p2",
    title: "Campus Event & Hackathon Portal",
    level: "Intermediate",
    techStack: ["React", "Tailwind CSS", "Local Storage"],
    desc: "Web app allowing Karnataka engineering students to filter hackathons by location, prize pool, and team size.",
    deliverables: ["Live Vercel Link", "GitHub Codebase", "Readme Documentation"],
  },
  {
    id: "p3",
    title: "Lab Record Observation Manager",
    level: "Intermediate",
    techStack: ["Python", "SQLite", "Tkinter / Web"],
    desc: "Desktop or web utility to track lab experiment submissions, viva notes, and professor signatures.",
    deliverables: ["Executable Package", "SQL Schema", "User Manual"],
  },
];

// Complementary Certifications Data
const certifications = [
  {
    title: "NPTEL Programming in C / Data Structures",
    provider: "IIT Kharagpur / NPTEL India",
    type: "Academic & Credit Transfer",
    duration: "8 - 12 Weeks",
    badge: "VTU Approved Credit",
    desc: "Official NPTEL certificate accepted for college elective credit transfers across Karnataka engineering colleges.",
  },
  {
    title: "AWS Certified Cloud Practitioner (CLF-C02)",
    provider: "Amazon Web Services",
    type: "Industry Certification",
    duration: "4 Weeks Prep",
    badge: "Global Standard",
    desc: "Foundational cloud certification covering AWS EC2, S3, IAM, and cloud architecture basics.",
  },
  {
    title: "Cisco Networking Essentials",
    provider: "Cisco Networking Academy",
    type: "Core Networking",
    duration: "6 Weeks",
    badge: "Industry Badge",
    desc: "Essential networking fundamentals, IP addressing, routing, and network security concepts.",
  },
];

// Complementary DSA Track Data
const dsaTrack = [
  { topic: "Arrays & Strings", count: "10 Problems", status: "Available", difficulty: "Easy" },
  { topic: "Pointers & Memory Allocation", count: "8 Problems", status: "Locked", difficulty: "Easy / Med" },
  { topic: "Singly & Doubly Linked Lists", count: "7 Problems", status: "Locked", difficulty: "Easy" },
  { topic: "Stacks & Queues", count: "6 Problems", status: "Locked", difficulty: "Medium" },
  { topic: "Recursion & Backtracking", count: "5 Problems", status: "Locked", difficulty: "Medium" },
];

// Complementary Resume Checklist Data
const resumeChecklist = [
  { id: "r1", title: "Setup GitHub Profile & Add Bio", done: false, phase: "Sem 1" },
  { id: "r2", title: "Complete First Proof-of-Work Project (C++/Python)", done: false, phase: "Sem 1" },
  { id: "r3", title: "Solve 25 LeetCode Easy Problems", done: false, phase: "Sem 2" },
  { id: "r4", title: "Join Campus Tech Club (IEEE / GDSC / ACM)", done: false, phase: "Sem 2" },
  { id: "r5", title: "Participate in First 24h Hackathon", done: false, phase: "Sem 2" },
  { id: "r6", title: "Build Full-Stack Project with Live Vercel Link", done: false, phase: "Sem 3" },
];

export default function RoadmapPage() {
  // Primary State from Backend Personalized Roadmap API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);
  const [studentContext, setStudentContext] = useState<RoadmapStudentContextDTO | null>(null);
  const [roadmap, setRoadmap] = useState<PersonalizedRoadmapDTO | null>(null);

  // Specialization Action State
  const [specializationUpdating, setSpecializationUpdating] = useState(false);
  const [specializationError, setSpecializationError] = useState<string | null>(null);
  const [showSwitchGateway, setShowSwitchGateway] = useState(false);

  // Active Tab State
  const [activeTab, setActiveTab] = useState<"tree" | "projects" | "dsa" | "certs" | "resume">("tree");

  // Selected Node Modal State
  const [selectedNode, setSelectedNode] = useState<PersonalizedRoadmapNodeDTO | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Resume Checklist Toggle State
  const [checklistState, setChecklistState] = useState(resumeChecklist);

  /**
   * Fetches authenticated student's personalized roadmap from GET /api/roadmaps/personalized
   */
  const fetchPersonalizedRoadmap = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/roadmaps/personalized", {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError("Authentication required. Please sign in to view your personalized roadmap.");
          setLoading(false);
          return;
        }
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Server error (${res.status})`);
      }

      const json: { success: boolean; data: PersonalizedRoadmapResponseDTO; message?: string } = await res.json();
      if (json.success && json.data) {
        setConfigured(Boolean(json.data.configured));
        setStudentContext(json.data.studentContext || null);
        setRoadmap(json.data.roadmap || null);
      } else {
        setConfigured(false);
        setRoadmap(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load personalized roadmap.";
      setError(msg);
      setRoadmap(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonalizedRoadmap();
  }, [fetchPersonalizedRoadmap]);

  /**
   * Updates student's specialization branch via PATCH /api/roadmaps/specialization
   */
  const handleSelectSpecialization = async (branch: string) => {
    try {
      setSpecializationUpdating(true);
      setSpecializationError(null);

      const res = await fetch("/api/roadmaps/specialization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ specializationBranch: branch }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update specialization branch.");
      }

      // Re-fetch authoritative personalized roadmap
      await fetchPersonalizedRoadmap();
      setShowSwitchGateway(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error selecting specialization branch.";
      setSpecializationError(msg);
    } finally {
      setSpecializationUpdating(false);
    }
  };

  /**
   * Updates a milestone node's progress via PATCH /api/roadmaps/[id]/progress
   */
  const handleUpdateNodeProgress = async (
    node: PersonalizedRoadmapNodeDTO,
    newStatus: "in_progress" | "completed"
  ) => {
    if (!roadmap) return;

    try {
      setStatusUpdating(true);
      const res = await fetch(`/api/roadmaps/${roadmap.id}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nodeId: node.id,
          status: newStatus,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update milestone progress.");
      }

      // Refetch authoritative personalized roadmap to recalculate statuses and unlock downstream nodes
      await fetchPersonalizedRoadmap();

      // Update selected modal node with updated state from response if possible
      setSelectedNode((prev) => (prev && prev.id === node.id ? { ...prev, status: newStatus } : prev));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update node progress.";
      alert(msg);
    } finally {
      setStatusUpdating(false);
    }
  };

  const toggleChecklist = (id: string) => {
    setChecklistState(
      checklistState.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  // Determine active career and specialization details
  const careerSlug = roadmap?.careerSlug || studentContext?.careerGoal || "";
  const careerLabel = CAREER_LABELS[careerSlug] || (careerSlug ? careerSlug.toUpperCase() : "Custom Track");
  const specializationBranch = studentContext?.specializationBranch || null;
  const isBranchableTrack = careerSlug === "core" || careerSlug === "higher_ed";
  const needsSpecialization = isBranchableTrack && specializationBranch === null;

  // Group visible nodes by targetSemester
  const nodesBySemester = React.useMemo(() => {
    if (!roadmap?.nodes || !Array.isArray(roadmap.nodes)) return {};
    const groups: Record<number, PersonalizedRoadmapNodeDTO[]> = {};
    roadmap.nodes.forEach((n) => {
      const sem = n.targetSemester || 1;
      if (!groups[sem]) groups[sem] = [];
      groups[sem].push(n);
    });
    return groups;
  }, [roadmap?.nodes]);

  const sortedSemesters = Object.keys(nodesBySemester)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <main className="min-h-screen bg-[#08090e] text-[#f3f4f6] selection:bg-purple-500/30 selection:text-purple-200">
      {/* Background Glow Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-radial-glow opacity-80" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      </div>

      {/* DYNAMIC HEADER NAVBAR */}
      <Navbar />

      {/* HERO & CONTEXT HEADER */}
      <section className="relative z-10 pt-8 pb-6 border-b border-white/10 bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
                <Compass className="size-4" />
                Deterministic Personalized Roadmap Engine
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {configured && roadmap ? `${roadmap.title}` : "Your Engineering Milestone Roadmap"}
              </h1>
              <p className="text-sm text-gray-400 max-w-2xl">
                {configured && roadmap?.description
                  ? roadmap.description
                  : "Personalized milestone execution path mapped to your career goal, university semesters, and prerequisite DAG."}
              </p>
            </div>

            {/* QUICK STATS CARD */}
            {configured && roadmap && (
              <div className="rounded-2xl border border-white/15 bg-black/60 p-4 backdrop-blur-xl flex items-center gap-6 self-start lg:self-auto">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Total Milestones</span>
                  <span className="text-2xl font-black text-white">{roadmap.totalNodes}</span>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Completed</span>
                  <span className="text-2xl font-black text-emerald-400">{roadmap.completedNodes}</span>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Progress</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-purple-400">{roadmap.progressPercentage}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACTIVE STUDENT CONTEXT SUMMARY BAR */}
          {configured && studentContext && (
            <div className="rounded-2xl border border-white/15 bg-black/60 p-4 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Career Track:</span>
                  <span className="font-bold text-white bg-white/10 px-2.5 py-1 rounded-lg">
                    {careerLabel}
                  </span>
                </div>

                {isBranchableTrack && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400">Specialization:</span>
                    {specializationBranch ? (
                      <span className="font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2.5 py-1 rounded-lg capitalize flex items-center gap-1.5">
                        <Sparkles className="size-3" />
                        {specializationBranch}
                      </span>
                    ) : (
                      <span className="font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <AlertCircle className="size-3" />
                        Branch Selection Required
                      </span>
                    )}
                  </div>
                )}

                {studentContext.semester && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400">Current Semester:</span>
                    <span className="font-semibold text-white bg-white/5 px-2 py-0.5 rounded">
                      Semester {studentContext.semester}
                    </span>
                  </div>
                )}
              </div>

              {isBranchableTrack && specializationBranch && (
                <button
                  onClick={() => setShowSwitchGateway(!showSwitchGateway)}
                  className="text-xs text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-4 cursor-pointer"
                >
                  {showSwitchGateway ? "Hide Branch Options" : "Switch Specialization"}
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 5 OUTPUT TABS NAVIGATION */}
      <section className="relative z-10 border-b border-white/10 bg-black/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none">
            {[
              { id: "tree", label: "Learning Tree (Personalized Nodes)", icon: Compass },
              { id: "projects", label: "Proof-of-Work Projects", icon: FolderGit2 },
              { id: "dsa", label: "DSA & LeetCode Track", icon: Code },
              { id: "certs", label: "Industry Certifications", icon: Award },
              { id: "resume", label: "Resume Milestone Checklist", icon: CheckCircle2 },
            ].map((tab) => {
              const IconComp = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    isSelected
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                      : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <IconComp className="size-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <section className="relative z-10 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* LOADING STATE */}
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <RefreshCw className="size-8 text-purple-400 animate-spin" />
              <p className="text-sm text-gray-400 font-medium">Resolving your personalized roadmap from the curriculum engine...</p>
            </div>
          )}

          {/* ERROR STATE */}
          {!loading && error && (
            <div className="rounded-3xl border border-red-500/30 bg-red-950/20 p-8 text-center space-y-4 max-w-xl mx-auto">
              <AlertCircle className="size-10 text-red-400 mx-auto" />
              <h2 className="text-lg font-bold text-white">Unable to Load Roadmap</h2>
              <p className="text-xs text-gray-300 leading-relaxed">{error}</p>
              <button
                onClick={fetchPersonalizedRoadmap}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition cursor-pointer"
              >
                <RefreshCw className="size-3.5" />
                Retry Loading
              </button>
            </div>
          )}

          {/* UNCONFIGURED STUDENT STATE (configured === false) */}
          {!loading && !error && !configured && (
            <div className="rounded-3xl border border-white/15 bg-black/60 p-10 text-center space-y-5 max-w-2xl mx-auto backdrop-blur-xl">
              <div className="size-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
                <Compass className="size-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">Career Track Not Selected Yet</h2>
                <p className="text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
                  CampusOS builds your milestone execution tree around your target career goal (SDE, AI/ML, Core Engineering, Higher Studies, or Startup Founder).
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition"
                >
                  Configure Career Goal in Onboarding
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          )}

          {/* TAB 1: PERSONALIZED LEARNING TREE */}
          {!loading && !error && configured && roadmap && activeTab === "tree" && (
            <div className="space-y-8">
              {/* SPECIALIZATION GATEWAY (When branch selection is required or toggled) */}
              {(needsSpecialization || showSwitchGateway) && isBranchableTrack && (
                <div className="rounded-3xl border border-purple-500/40 bg-gradient-to-b from-purple-950/30 to-black/60 p-6 md:p-8 backdrop-blur-xl space-y-6 shadow-2xl">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
                      <Sparkles className="size-3.5" />
                      Specialization Gateway
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-white">
                      {careerSlug === "core"
                        ? "Choose Your Core Engineering Specialization"
                        : "Choose Your Higher Studies Pathway"}
                    </h2>
                    <p className="text-xs text-gray-300 max-w-3xl leading-relaxed">
                      {careerSlug === "core"
                        ? "Selecting a branch unlocks specialized hardware/firmware milestones and the terminal convergence capstone milestone (core_11)."
                        : "Selecting a branch unlocks exam/application preparation modules and the final convergence transition milestone (he_08)."}
                    </p>
                  </div>

                  {specializationError && (
                    <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300 flex items-center gap-2">
                      <AlertCircle className="size-4 shrink-0" />
                      <span>{specializationError}</span>
                    </div>
                  )}

                  {/* BRANCH CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(careerSlug === "core" ? CORE_SPECIALIZATION_OPTIONS : HIGHER_ED_SPECIALIZATION_OPTIONS).map(
                      (opt) => {
                        const IconComp = opt.icon;
                        const isCurrent = specializationBranch === opt.branch;

                        return (
                          <div
                            key={opt.branch}
                            onClick={() => !specializationUpdating && handleSelectSpecialization(opt.branch)}
                            className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 transition cursor-pointer ${
                              isCurrent
                                ? "border-purple-500 bg-purple-950/40 shadow-lg shadow-purple-500/20"
                                : "border-white/10 bg-white/[0.02] hover:border-purple-500/50 hover:bg-white/[0.04]"
                            } ${specializationUpdating ? "opacity-50 pointer-events-none" : ""}`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="size-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300">
                                  <IconComp className="size-5" />
                                </div>
                                {isCurrent && (
                                  <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded-full">
                                    Active Branch
                                  </span>
                                )}
                              </div>
                              <h3 className="text-sm font-bold text-white">{opt.title}</h3>
                              <p className="text-[11px] font-medium text-purple-300/80">{opt.subtitle}</p>
                              <p className="text-xs text-gray-400 leading-relaxed">{opt.desc}</p>
                            </div>

                            <button
                              disabled={specializationUpdating}
                              className={`w-full py-2 text-xs font-bold rounded-xl transition ${
                                isCurrent
                                  ? "bg-purple-600 text-white"
                                  : "bg-white/10 hover:bg-white/20 text-white"
                              }`}
                            >
                              {specializationUpdating ? "Updating..." : isCurrent ? "Current Branch" : `Select ${opt.title}`}
                            </button>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {/* SEMESTER-BY-SEMESTER NODE TREE */}
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Layers className="size-4 text-purple-400" />
                      Authoritative Semester Milestone Tree
                    </h2>
                    <p className="text-xs text-gray-400">
                      Organized strictly by curriculum target semester. Click any milestone to inspect syllabus, prerequisites, and update completion.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <span className="size-2 rounded-full bg-emerald-400" /> Completed
                    </span>
                    <span className="flex items-center gap-1.5 text-purple-400 font-medium">
                      <span className="size-2 rounded-full bg-purple-400" /> In Progress
                    </span>
                    <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
                      <span className="size-2 rounded-full bg-cyan-400" /> Available
                    </span>
                    <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                      <span className="size-2 rounded-full bg-gray-500" /> Locked
                    </span>
                  </div>
                </div>

                {/* SEMESTER GROUPS */}
                {sortedSemesters.map((semNum) => {
                  const semesterNodes = nodesBySemester[semNum] || [];

                  return (
                    <div key={semNum} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-300 bg-purple-950/60 border border-purple-500/30 px-3 py-1 rounded-lg">
                          Semester {semNum}
                        </span>
                        <div className="h-px flex-1 bg-white/10" />
                        <span className="text-xs text-gray-500 font-medium">
                          {semesterNodes.length} {semesterNodes.length === 1 ? "Milestone" : "Milestones"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {semesterNodes.map((node) => {
                          const isCompleted = node.status === "completed";
                          const isInProgress = node.status === "in_progress";
                          const isUnlocked = node.status === "unlocked";

                          return (
                            <div
                              key={node.id}
                              onClick={() => setSelectedNode(node)}
                              className={`group relative rounded-3xl border p-5 shadow-xl transition-all cursor-pointer flex flex-col justify-between ${
                                isCompleted
                                  ? "border-emerald-500/30 bg-emerald-950/10 hover:border-emerald-500/60"
                                  : isInProgress
                                  ? "border-purple-500/40 bg-purple-950/20 hover:border-purple-500/80 shadow-purple-500/10 shadow-lg"
                                  : isUnlocked
                                  ? "border-cyan-500/30 bg-cyan-950/10 hover:border-cyan-500/60"
                                  : "border-white/10 bg-white/[0.02] hover:border-white/20 opacity-70"
                              }`}
                            >
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                      #{node.sequenceNo} • Sem {node.targetSemester || semNum}
                                    </span>
                                    {node.branch && (
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded">
                                        {node.branch}
                                      </span>
                                    )}
                                  </div>

                                  {isCompleted ? (
                                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                      <CheckCircle2 className="size-3" /> Done
                                    </span>
                                  ) : isInProgress ? (
                                    <span className="flex items-center gap-1 text-[11px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30">
                                      <Clock className="size-3" /> In Progress
                                    </span>
                                  ) : isUnlocked ? (
                                    <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/30">
                                      <Sparkles className="size-3" /> Available
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-[11px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                                      <Lock className="size-3" /> Locked
                                    </span>
                                  )}
                                </div>

                                <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition">
                                  {node.title}
                                </h3>

                                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                                  {node.description || "Core milestone node."}
                                </p>
                              </div>

                              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                                <span className="text-[11px] text-gray-500 font-mono">
                                  {node.nodeKey}
                                </span>
                                <span className="text-purple-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                  Inspect <ChevronRight className="size-3.5" />
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: PROOF-OF-WORK PROJECTS (P9) */}
          {activeTab === "projects" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Recommended Proof-of-Work Projects</h2>
                <p className="text-xs text-gray-400">
                  Real engineering builds with objectives, prerequisites, build guides, and verification checklists.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {PROOF_OF_WORK_PROJECTS.map((p) => (
                  <div key={p.id} className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 space-y-4 flex flex-col justify-between hover:border-purple-500/40 transition">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-400">{p.level}</span>
                        <div className="flex flex-wrap gap-1">
                          {p.recommendedStack.map((t, idx) => (
                            <span key={idx} className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-300">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-white">{p.title}</h3>
                      <p className="text-xs text-gray-300 leading-relaxed">{p.objective}</p>

                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5 text-xs">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Prerequisites & Skills
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {p.prerequisiteSkills.map((sk, sIdx) => (
                            <span key={sIdx} className="text-[10px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-1.5 text-xs">
                        <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">
                          Proof-of-Work Checklist
                        </span>
                        <ul className="space-y-1 text-gray-300">
                          {p.proofOfWorkChecklist.map((chk, cIdx) => (
                            <li key={cIdx} className="flex items-start gap-2">
                              <CheckCircle2 className="size-3 text-emerald-400 shrink-0 mt-0.5" />
                              <span className="text-[11px] leading-tight">{chk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                      <a
                        href={p.documentationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 transition"
                      >
                        <span>Documentation</span>
                        <ExternalLink className="size-3" />
                      </a>
                      {p.deploymentReferenceUrl && (
                        <a
                          href={p.deploymentReferenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-white transition"
                        >
                          <span>Deploy Guide</span>
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ACTIONABLE DSA TRACK (P8) */}
          {activeTab === "dsa" && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-lg font-bold text-white">Actionable 1st & 2nd Year DSA Progression</h2>
                <p className="text-xs text-gray-400">
                  Concept masterclasses with English and Hindi videos paired directly with external problem sets on LeetCode, Striver A2Z, and NeetCode.
                </p>
              </div>

              <div className="space-y-4">
                {DSA_PRACTICE_TOPICS.map((topic) => (
                  <div key={topic.topicKey} className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 space-y-4 hover:border-purple-500/30 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">{topic.topicName}</h3>
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-bold">
                            {topic.difficulty}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Next Recommended: <span className="text-purple-300 font-semibold">{topic.recommendedNextTopic}</span>
                        </p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-lg font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
                        Curated Topic
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* LEARN COLUMN */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">
                          Learn: Concepts & Tutorials
                        </span>
                        <a
                          href={topic.learn.conceptDoc.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:border-purple-500/40 hover:bg-white/[0.05] transition text-xs text-gray-200"
                        >
                          <span className="truncate pr-2">{topic.learn.conceptDoc.title} ({topic.learn.conceptDoc.provider})</span>
                          <ExternalLink className="size-3 text-purple-400 shrink-0" />
                        </a>
                        {topic.learn.youtubeEnglish && (
                          <a
                            href={topic.learn.youtubeEnglish.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:border-rose-500/40 hover:bg-white/[0.05] transition text-xs text-gray-200"
                          >
                            <span className="truncate pr-2">English: {topic.learn.youtubeEnglish.title}</span>
                            <ExternalLink className="size-3 text-rose-400 shrink-0" />
                          </a>
                        )}
                        {topic.learn.youtubeHindi && (
                          <a
                            href={topic.learn.youtubeHindi.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:border-rose-500/40 hover:bg-white/[0.05] transition text-xs text-gray-200"
                          >
                            <span className="truncate pr-2">Hindi: {topic.learn.youtubeHindi.title}</span>
                            <ExternalLink className="size-3 text-rose-400 shrink-0" />
                          </a>
                        )}
                      </div>

                      {/* PRACTICE COLUMN */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                          Practice: External Coding Platforms
                        </span>
                        <div className="space-y-2">
                          {topic.practice.map((pr, prIdx) => (
                            <a
                              key={prIdx}
                              href={pr.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:border-emerald-500/40 hover:bg-white/[0.05] transition text-xs text-gray-200"
                            >
                              <div>
                                <span className="font-semibold block">{pr.title}</span>
                                <span className="text-[10px] text-gray-400">{pr.platform} • {pr.sheetName}</span>
                              </div>
                              <ExternalLink className="size-3 text-emerald-400 shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: INDUSTRY & ACADEMIC CERTIFICATIONS (P10) */}
          {activeTab === "certs" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Verified Industry & Academic Certification Catalog</h2>
                <p className="text-xs text-gray-400">
                  Curated credentials from AWS, Microsoft, Cisco, Google Cloud, NVIDIA, IBM, and Linux Foundation with verified student access.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {INDUSTRY_CERTIFICATIONS.map((c) => (
                  <div key={c.certId} className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 space-y-3 flex flex-col justify-between hover:border-purple-500/40 transition">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-purple-500/30">
                          {c.domain.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {c.examType === "free_certificate" ? "Free Certificate" : c.examType === "paid_exam" ? "Paid Exam" : "Free Prep / Paid Exam"}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white">{c.title}</h3>
                      <span className="text-xs text-gray-400 block">{c.provider} • {c.level}</span>
                      <p className="text-xs text-gray-400 leading-relaxed">{c.description}</p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {c.skills.map((sk, sIdx) => (
                          <span key={sIdx} className="text-[10px] bg-white/5 text-gray-300 px-1.5 py-0.5 rounded">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        {c.studentDiscountAvailable ? "Student Discount Verified" : "Open Access"}
                      </span>
                      <a
                        href={c.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 transition cursor-pointer"
                      >
                        <span>Official Portal</span>
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: RESUME CHECKLIST */}
          {activeTab === "resume" && (
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-lg font-bold text-white">Engineering Resume Milestones</h2>
              <div className="space-y-2">
                {checklistState.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleChecklist(item.id)}
                    className="flex items-center gap-3 p-3.5 rounded-2xl border border-white/10 bg-white/[0.02] cursor-pointer hover:bg-white/[0.05] transition"
                  >
                    <div className={`size-5 rounded-md flex items-center justify-center border ${
                      item.done ? "bg-purple-600 border-purple-500 text-white" : "border-white/20"
                    }`}>
                      {item.done && <Check className="size-3.5" />}
                    </div>
                    <div className="flex-1">
                      <span className={`text-xs sm:text-sm block ${item.done ? "line-through text-gray-500" : "text-white"}`}>
                        {item.title}
                      </span>
                      <span className="text-[10px] text-gray-500">{item.phase}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* NODE INSPECTOR MODAL */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-purple-500/30 bg-[#0d0f18] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">
                  Semester {selectedNode.targetSemester || 1} • Milestone #{selectedNode.sequenceNo}
                </span>
                <h3 className="text-base font-bold text-white">{selectedNode.title}</h3>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-gray-300">
              <p>{selectedNode.description || "Core milestone for this semester."}</p>

              {selectedNode.evidencePrompt && (
                <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">
                    Proof-of-Work Evidence
                  </span>
                  <p className="text-xs text-gray-300">{selectedNode.evidencePrompt}</p>
                </div>
              )}
            </div>

            {/* PREREQUISITES INSPECTOR */}
            {selectedNode.prerequisiteKeys && selectedNode.prerequisiteKeys.length > 0 && (
              <div className="space-y-2 border-t border-white/10 pt-3 text-xs">
                <span className="text-gray-400 font-bold block">Prerequisites:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.prerequisiteKeys.map((prereq) => {
                    const isMissing = selectedNode.missingPrerequisites?.includes(prereq);
                    return (
                      <span
                        key={prereq}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                          isMissing
                            ? "bg-red-500/10 border-red-500/30 text-red-300"
                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        }`}
                      >
                        {prereq} {isMissing ? "• pending" : "• done"}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* WHERE DO I LEARN THIS? (P7) */}
            {(() => {
              const drawer = getRoadmapNodeDrawer(selectedNode.nodeKey, selectedNode.title, selectedNode.description || undefined);
              return (
                <div className="space-y-3 border-t border-white/10 pt-3 text-xs">
                  <span className="text-purple-400 font-bold uppercase tracking-wider text-[10px] block">
                    Where Do I Learn This?
                  </span>

                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {/* Documentation & Free Courses */}
                    {[...(drawer.officialDocs || []), ...(drawer.freeCourses || [])].map((d) => (
                      <a
                        key={d.resourceId}
                        href={d.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 rounded-xl border border-white/10 bg-white/[0.02] hover:border-purple-500/40 hover:bg-white/[0.05] transition text-gray-300"
                      >
                        <span className="truncate pr-2 font-medium">{d.title}</span>
                        <ExternalLink className="size-3 text-purple-400 shrink-0" />
                      </a>
                    ))}

                    {/* YouTube Video Tutorials */}
                    {drawer.youtube?.english?.map((yt) => (
                      <a
                        key={yt.resourceId}
                        href={yt.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 rounded-xl border border-white/10 bg-white/[0.02] hover:border-rose-500/40 hover:bg-white/[0.05] transition text-gray-300"
                      >
                        <span className="truncate pr-2 font-medium">Video: {yt.title}</span>
                        <ExternalLink className="size-3 text-rose-400 shrink-0" />
                      </a>
                    ))}

                    {/* Practice platform */}
                    {drawer.practice?.map((pr) => (
                      <a
                        key={pr.resourceId}
                        href={pr.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 rounded-xl border border-white/10 bg-white/[0.02] hover:border-emerald-500/40 hover:bg-white/[0.05] transition text-gray-300"
                      >
                        <span className="truncate pr-2 font-medium">Practice: {pr.title}</span>
                        <ExternalLink className="size-3 text-emerald-400 shrink-0" />
                      </a>
                    ))}
                  </div>

                  {drawer.proofOfWorkChecklist && drawer.proofOfWorkChecklist.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block">
                        Milestone Deliverables:
                      </span>
                      <ul className="space-y-0.5 text-gray-300 text-[11px]">
                        {drawer.proofOfWorkChecklist.slice(0, 3).map((item, iIdx) => (
                          <li key={iIdx} className="flex items-center gap-1.5">
                            <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* STATUS & PROGRESS UPDATE BUTTONS */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-medium">Status:</span>
                <span className="font-bold capitalize text-white">{selectedNode.status.replace("_", " ")}</span>
              </div>

              {selectedNode.status === "unlocked" && (
                <button
                  disabled={statusUpdating}
                  onClick={() => handleUpdateNodeProgress(selectedNode, "in_progress")}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white rounded-xl transition cursor-pointer shadow-lg shadow-purple-600/30 disabled:opacity-50"
                >
                  {statusUpdating ? "Updating..." : "Start Milestone (In Progress)"}
                </button>
              )}

              {selectedNode.status === "in_progress" && (
                <button
                  disabled={statusUpdating}
                  onClick={() => handleUpdateNodeProgress(selectedNode, "completed")}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-xl transition cursor-pointer shadow-lg shadow-emerald-600/30 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="size-4" />
                  {statusUpdating ? "Updating..." : "Mark Milestone Completed"}
                </button>
              )}

              {selectedNode.status === "completed" && (
                <div className="w-full py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="size-4" />
                  Milestone Completed
                </div>
              )}

              {selectedNode.status === "locked" && (
                <div className="w-full py-2 bg-white/5 border border-white/10 text-gray-400 rounded-xl text-xs text-center">
                  Prerequisites pending. Complete prior milestones to unlock.
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedNode(null)}
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
