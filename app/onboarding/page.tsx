/**
 * @file app/onboarding/page.tsx
 * @description 60-Second Freshers Onboarding Flow for CampusOS.
 * @purpose Collects student college, branch, semester, goals & preferences, and persists profile via /api/profile and /api/settings.
 */

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { CollegeDTO, CourseDTO } from "@/types/api.types";
import {
  GraduationCap,
  Code,
  BrainCircuit,
  ChevronRight,
  ChevronLeft,
  Rocket,
  Check,
  Zap,
  ArrowRight,
  Flame,
  Loader2,
  AlertCircle,
  Search,
  Building2,
  X,
  Database,
  Shield,
  Cloud,
  Cpu,
  Layers,
  Palette,
  Server,
  Compass,
} from "lucide-react";

// Fallback academic data while API loads
const defaultColleges: { collegeId: number; collegeName: string; location: string | null }[] = [
  { collegeId: 1, collegeName: "RV College of Engineering (RVCE)", location: "Bengaluru" },
  { collegeId: 2, collegeName: "BMS College of Engineering (BMSCE)", location: "Bengaluru" },
  { collegeId: 3, collegeName: "PES University (PESU)", location: "Bengaluru" },
  { collegeId: 4, collegeName: "MS Ramaiah Institute of Technology (MSRIT)", location: "Bengaluru" },
  { collegeId: 5, collegeName: "The National Institute of Engineering (NIE)", location: "Mysore" },
  { collegeId: 6, collegeName: "KLS Gogte Institute of Technology (GIT)", location: "Belagavi" },
  { collegeId: 7, collegeName: "Siddaganga Institute of Technology (SIT)", location: "Tumakuru" },
  { collegeId: 8, collegeName: "Dayananda Sagar College of Engineering (DSCE)", location: "Bengaluru" },
];

export const engineeringBranches = [
  { id: "cse", name: "Computer Science & Engineering", code: "CSE", desc: "Core computing, systems, algorithms, AI & software engineering." },
  { id: "ise", name: "Information Science & Engineering", code: "ISE", desc: "Software design, data engineering, networking & web technologies." },
  { id: "aiml", name: "Artificial Intelligence & Machine Learning", code: "AIML", desc: "Machine learning, neural networks, data science & analytics." },
  { id: "ece", name: "Electronics & Communication Engineering", code: "ECE", desc: "VLSI, embedded systems, microcontrollers, signal processing & IoT." },
  { id: "eee", name: "Electrical & Electronics Engineering", code: "EEE", desc: "Power systems, smart grids, control engineering & electric vehicles." },
  { id: "mech", name: "Mechanical Engineering", code: "MECH", desc: "Robotics, thermal systems, CAD/CAM, automotive & manufacturing." },
  { id: "civil", name: "Civil Engineering", code: "CIVIL", desc: "Structural analysis, geotechnical systems & sustainable infrastructure." },
  { id: "other", name: "Other / Specialized Engineering Branch", code: "OTHER", desc: "CSE (Cyber Security), CSE (IoT), Robotics, Biomedical, Aeronautical, etc." },
];

const semesterList = [
  { sem: 1, label: "Semester 1", badge: "Physics / Chem Cycle" },
  { sem: 2, label: "Semester 2", badge: "C Programming & Basic Engg" },
  { sem: 3, label: "Semester 3", badge: "Core Branch Orientation" },
  { sem: 4, label: "Semester 4", badge: "DSA & Mini Projects" },
  { sem: 5, label: "Semester 5", badge: "Specialization & Internships" },
  { sem: 6, label: "Semester 6", badge: "Placement Acceleration" },
  { sem: 7, label: "Semester 7", badge: "Campus Placement Drives" },
  { sem: 8, label: "Semester 8", badge: "Major Project & Graduation" },
];

const evaluationTypes = [
  {
    id: "vtu",
    title: "VTU Affiliated College",
    desc: "Central VTU 2022/2025 scheme (50-mark CIE + 50-mark SEE).",
    badge: "VTU Central",
  },
  {
    id: "autonomous",
    title: "Autonomous College",
    desc: "College-specific CIE rubrics & internal credit evaluation.",
    badge: "Autonomous",
  },
];

export const careerGoals = [
  {
    id: "sde",
    title: "Software Engineer (SDE)",
    desc: "Target product tech companies with high DSA & System Design focus.",
    icon: Code,
  },
  {
    id: "ai_ml",
    title: "AI / Machine Learning Specialist",
    desc: "Focus on Data Science, LLMs, Neural Networks & Python.",
    icon: BrainCircuit,
  },
  {
    id: "core",
    title: "Core Electronics / Embedded / Robotics",
    desc: "Focus on VLSI, Microcontrollers, IoT & Hardware Systems.",
    icon: Zap,
  },
  {
    id: "higher_ed",
    title: "Higher Studies (GATE / MS / MBA)",
    desc: "Prepare for competitive entrance exams & research admissions.",
    icon: GraduationCap,
  },
  {
    id: "founder",
    title: "Startup Founder / Product Builder",
    desc: "Build real-world web/mobile products and find hackathon teammates.",
    icon: Rocket,
  },
  {
    id: "data_science",
    title: "Data Science / Data Analytics",
    desc: "Statistical modeling, big data manipulation, SQL, Pandas & BI analytics.",
    icon: Database,
  },
  {
    id: "cybersecurity",
    title: "Cybersecurity & InfoSec",
    desc: "Network defense, vulnerability assessments, ethical hacking & SIEM.",
    icon: Shield,
  },
  {
    id: "cloud_devops",
    title: "Cloud & DevOps Engineer",
    desc: "Docker, Kubernetes, CI/CD pipelines, AWS/GCP, infrastructure as code.",
    icon: Cloud,
  },
  {
    id: "iot_embedded",
    title: "IoT & Embedded Systems",
    desc: "Sensors, microcontrollers, RTOS, edge processing & firmware design.",
    icon: Cpu,
  },
  {
    id: "blockchain_web3",
    title: "Blockchain & Web3 Developer",
    desc: "Smart contracts, Solidity, decentralized protocols & cryptographic apps.",
    icon: Layers,
  },
  {
    id: "product_design",
    title: "Product / UI-UX / Design",
    desc: "User research, Figma design systems, interaction design & prototyping.",
    icon: Palette,
  },
  {
    id: "data_engineering",
    title: "Data Engineering",
    desc: "Large scale ETL pipelines, Apache Spark, Kafka & data warehouses.",
    icon: Server,
  },
  {
    id: "other",
    title: "Other / Custom Career Goal",
    desc: "Enter your custom career trajectory and targeted engineering discipline.",
    icon: Compass,
  },
];

const programmingLevels = [
  { id: "beginner", title: "Absolute Beginner", desc: "Never written code before (Fresh Start)", xp: "+10 XP" },
  { id: "c_basic", title: "C / C++ Basics", desc: "Know variables, loops, arrays & basic functions", xp: "+20 XP" },
  { id: "python_basic", title: "Python Practitioner", desc: "Can write basic scripts and data manipulations", xp: "+30 XP" },
  { id: "web_dev", title: "Web / App Builder", desc: "Built HTML/CSS/JS or mobile apps before", xp: "+40 XP" },
];

const languagesList = [
  { id: "english", label: "English", native: "English (Default)" },
  { id: "kannada", label: "Kannada", native: "ಕನ್ನಡ (Karnataka Native)" },
  { id: "hindi", label: "Hindi", native: "हिंदी (Hindi)" },
];

const studyTimeOptions = [
  { id: "15mins", title: "15 mins / day", tag: "Casual Pace", desc: "Quick daily streak maintenance & notes review." },
  { id: "30mins", title: "30 mins / day", tag: "Steady (Recommended)", desc: "Optimal pace for 1st-year subject mastery." },
  { id: "1hr", title: "1 hr / day", tag: "Focused Pace", desc: "Builds solid coding skills alongside academics." },
  { id: "2hrs", title: "2 hrs / day", tag: "Hardcore SDE Pace", desc: "Fast-tracks LeetCode, GitHub & hackathons." },
];

const interestsList = [
  { id: "web", label: "Full-Stack Web Dev", tag: "High Demand" },
  { id: "ai", label: "AI & Machine Learning", tag: "Trending" },
  { id: "app", label: "Mobile App Dev (Flutter/React Native)", tag: "Product" },
  { id: "hackathons", label: "Hackathons & Tech Contests", tag: "Events" },
  { id: "electronics", label: "Embedded Systems & IoT", tag: "Hardware" },
  { id: "opensource", label: "Open Source & Systems", tag: "Community" },
];

function OnboardingContent() {
  const router = useRouter();
  const { user, profile, refreshSession } = useAuth();

  const [step, setStep] = useState(1);
  const totalSteps = 9;

  // Dynamic API state
  const [colleges, setColleges] = useState<CollegeDTO[]>([]);
  const [courses, setCourses] = useState<CourseDTO[]>([]);

  // Form States
  const [collegeId, setCollegeId] = useState<number>(1);
  const [courseId, setCourseId] = useState<number>(1);
  const [specializationBranch, setSpecializationBranch] = useState<string>("Computer Science & Engineering");
  const [customBranch, setCustomBranch] = useState<string>("");
  const [isOtherBranch, setIsOtherBranch] = useState<boolean>(false);
  const [semester, setSemester] = useState<number>(1);
  const [evalType, setEvalType] = useState("vtu");
  const [careerGoal, setCareerGoal] = useState("sde");
  const [customCareerGoal, setCustomCareerGoal] = useState<string>("");
  const [isOtherCareerGoal, setIsOtherCareerGoal] = useState<boolean>(false);
  const [targetSgpa, setTargetSgpa] = useState<number>(8.5);
  const [progLevel, setProgLevel] = useState("beginner");
  const [prefLang, setPrefLang] = useState("english");
  const [studyTime, setStudyTime] = useState("30mins");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["web", "ai"]);

  // Searchable College Combobox State
  const [collegeSearch, setCollegeSearch] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(0);

  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch live colleges and courses on mount
  useEffect(() => {
    const fetchAcademicData = async () => {
      try {
        const [collegesRes, coursesRes] = await Promise.all([
          fetch("/api/academics/colleges", { credentials: "include" }),
          fetch("/api/academics/courses", { credentials: "include" }),
        ]);

        if (collegesRes.ok) {
          const colJson = await collegesRes.json();
          if (colJson.success && Array.isArray(colJson.data) && colJson.data.length > 0) {
            setColleges(colJson.data);
            setCollegeId(profile?.collegeId || colJson.data[0].collegeId);
          }
        }

        if (coursesRes.ok) {
          const courJson = await coursesRes.json();
          if (courJson.success && Array.isArray(courJson.data) && courJson.data.length > 0) {
            setCourses(courJson.data);
            setCourseId(profile?.courseId || courJson.data[0].courseId);
          }
        }
      } catch {
        // Fallback to default lists
      }
    };

    fetchAcademicData();
  }, [profile]);

  // Pre-populate if profile already exists
  useEffect(() => {
    if (profile) {
      if (profile.collegeId) setCollegeId(profile.collegeId);
      if (profile.courseId) setCourseId(profile.courseId);
      if (profile.specializationBranch) {
        setSpecializationBranch(profile.specializationBranch);
        const isCanonical = engineeringBranches.some(
          (b) => b.id !== "other" && b.name.toLowerCase() === profile.specializationBranch?.toLowerCase()
        );
        if (!isCanonical) {
          setIsOtherBranch(true);
          setCustomBranch(profile.specializationBranch);
        }
      }
      if (profile.semester) setSemester(profile.semester);
      if (profile.careerGoal) {
        setCareerGoal(profile.careerGoal);
        const isKnown = careerGoals.some(
          (cg) => cg.id !== "other" && cg.id.toLowerCase() === profile.careerGoal?.toLowerCase()
        );
        if (!isKnown) {
          setIsOtherCareerGoal(true);
          setCustomCareerGoal(profile.careerGoal);
          setCareerGoal("other");
        }
      }
      if (profile.evaluationScheme) setEvalType(profile.evaluationScheme);
      if (profile.targetSgpa !== null && profile.targetSgpa !== undefined) {
        setTargetSgpa(Number(profile.targetSgpa));
      }
      if (profile.programmingLevel) setProgLevel(profile.programmingLevel);
      if (
        profile.technicalInterests &&
        Array.isArray(profile.technicalInterests) &&
        profile.technicalInterests.length > 0
      ) {
        setSelectedInterests(profile.technicalInterests);
      }
    }
  }, [profile]);

  const displayColleges = colleges.length > 0 ? colleges : defaultColleges;

  const currentCollegeName =
    displayColleges.find((c) => c.collegeId === collegeId)?.collegeName || "Your College";
  const currentBranchName =
    isOtherBranch && customBranch.trim()
      ? customBranch.trim()
      : specializationBranch || "Computer Science & Engineering";
  const currentGoalTitle =
    isOtherCareerGoal && customCareerGoal.trim()
      ? customCareerGoal.trim()
      : careerGoals.find((c) => c.id === careerGoal)?.title || "Software Engineer (SDE)";

  // Filtered colleges for searchable combobox
  const filteredColleges = displayColleges.filter((c) => {
    const query = collegeSearch.toLowerCase().trim();
    if (!query) return true;
    return (
      c.collegeName.toLowerCase().includes(query) ||
      (c.location && c.location.toLowerCase().includes(query))
    );
  });

  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== id));
    } else {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  /**
   * Persists student profile and settings, refreshes global session state, and redirects to dashboard.
   */
  const handleSaveAndLaunch = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Choose POST (if no profile exists) vs PATCH (if profile already exists)
      const method = profile ? "PATCH" : "POST";

      const resolvedBranch = isOtherBranch && customBranch.trim() ? customBranch.trim() : specializationBranch;
      const resolvedGoal = isOtherCareerGoal && customCareerGoal.trim() ? customCareerGoal.trim() : careerGoal;

      const profilePayload = {
        firstName: profile?.firstName || user?.email?.split("@")[0] || "Student",
        lastName: profile?.lastName || undefined,
        collegeId: Number(collegeId),
        courseId: Number(courseId),
        specializationBranch: resolvedBranch || undefined,
        semester: Number(semester),
        careerGoal: resolvedGoal,
        evaluationScheme: evalType,
        targetSgpa: Number(targetSgpa),
        programmingLevel: progLevel,
        technicalInterests: selectedInterests,
      };

      const profileRes = await fetch("/api/profile", {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profilePayload),
      });

      if (!profileRes.ok) {
        // If profile was initialized concurrently, gracefully fallback to PATCH
        if (profileRes.status === 409) {
          const patchRes = await fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(profilePayload),
          });
          if (!patchRes.ok) {
            const errJson = await patchRes.json();
            throw new Error(errJson.error?.message || errJson.message || "Failed to update profile.");
          }
        } else {
          const errJson = await profileRes.json();
          throw new Error(errJson.error?.message || errJson.message || "Failed to save profile.");
        }
      }

      // Persist language and theme preferences
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          language: prefLang,
          theme: "dark",
        }),
      });

      // Hydrate global session state
      await refreshSession();

      // Navigate to Mission Control
      router.push("/#demo");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred while saving your profile.";
      setError(msg);
      setIsSaving(false);
    }
  };

  const progressPercentage = Math.round((step / totalSteps) * 100);

  return (
    <main className="min-h-screen bg-[#08090e] text-[#f3f4f6] selection:bg-purple-500/30 selection:text-purple-200 flex flex-col justify-between relative overflow-x-hidden">
      {/* Background Glow Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[450px] bg-radial-glow opacity-80" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      </div>

      {/* TOP HEADER & DUOLINGO-STYLE PROGRESS BAR */}
      <header className="relative z-10 border-b border-white/10 bg-[#08090e]/80 backdrop-blur-xl px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
          <button
            onClick={handleBack}
            disabled={step === 1 || isFinished}
            className={`p-1.5 rounded-lg border transition ${
              step === 1 || isFinished
                ? "opacity-20 border-transparent text-gray-500 cursor-not-allowed"
                : "border-white/10 text-gray-300 hover:bg-white/10 cursor-pointer"
            }`}
          >
            <ChevronLeft className="size-5" />
          </button>

          {!isFinished && (
            <div className="flex-1 max-w-xs space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400">
                <span className="text-purple-400">60s Quick Setup</span>
                <span>{step} of {totalSteps}</span>
              </div>
              <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-300 shadow-sm shadow-purple-500/50"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/20 text-xs font-bold">
            <Flame className="size-3.5" />
            <span>+100 XP</span>
          </div>
        </div>
      </header>

      {/* MAIN ONBOARDING CARD CONTAINER */}
      <div className="relative z-10 mx-auto w-full max-w-xl px-4 py-6 sm:px-6 flex-1 flex flex-col justify-center">
        {isFinished ? (
          /* COMPLETION & MISSION REVEAL SCREEN */
          <div className="rounded-3xl border border-purple-500/40 bg-gradient-to-b from-[#111322] to-[#08090e] p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-pulse-glow">
            <div className="size-16 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-purple-500/40">
              <Rocket className="size-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                Personalization 100% Ready
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Welcome to Mission Control!
              </h1>
              <p className="text-xs sm:text-sm text-gray-300 max-w-sm mx-auto">
                Your engineering workspace for <span className="text-purple-300 font-semibold">{currentCollegeName}</span> is configured.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 text-left">
                <AlertCircle className="size-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Generated Profile Summary */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-bold text-gray-400">Personalized Profile</span>
                <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                  {evalType} Scheme
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-gray-300">
                <div>
                  <span className="text-gray-500 block text-[10px]">College</span>
                  <strong className="text-white block truncate">{currentCollegeName}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">Branch & Semester</span>
                  <strong className="text-white block truncate">{currentBranchName} • Sem {semester}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">Daily Study Goal</span>
                  <strong className="text-cyan-400">{studyTimeOptions.find((s) => s.id === studyTime)?.title}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">Target Career</span>
                  <strong className="text-purple-400">{careerGoals.find((c) => c.id === careerGoal)?.title}</strong>
                </div>
                <div className="col-span-2 pt-1 border-t border-white/5 flex items-center justify-between">
                  <span className="text-gray-400 text-[11px] font-semibold">Target SGPA:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="6.0"
                      max="10.0"
                      step="0.1"
                      value={targetSgpa}
                      onChange={(e) => setTargetSgpa(Number(e.target.value))}
                      className="w-24 sm:w-32 accent-purple-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                    />
                    <strong className="text-purple-300 font-mono text-xs">{targetSgpa.toFixed(1)}</strong>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveAndLaunch}
              disabled={isSaving}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-sm font-bold text-white shadow-lg shadow-purple-600/30 hover:scale-[1.02] active:scale-98 transition cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Saving Profile to CampusOS...</span>
                </>
              ) : (
                <>
                  <span>Enter Mission Control</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </div>
        ) : (
          /* 9 QUESTION CARDS */
          <div className="space-y-6">
            {/* Q1: COLLEGE (Searchable Combobox) */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Question 1 of 9</span>
                    <span className="text-[11px] text-gray-400 font-semibold">{displayColleges.length} institutions in catalogue</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white">Which college did you join?</h1>
                  <p className="text-xs text-gray-400">Search across 190+ accredited Karnataka engineering institutions for syllabus & senior playbooks.</p>
                </div>

                {/* Search Input Box */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-purple-400" />
                  <input
                    type="text"
                    value={collegeSearch}
                    onChange={(e) => {
                      setCollegeSearch(e.target.value);
                      setFocusedIndex(0);
                    }}
                    onKeyDown={(e) => {
                      if (filteredColleges.length === 0) return;
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setFocusedIndex((prev) => (prev < filteredColleges.length - 1 ? prev + 1 : prev));
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        const target = filteredColleges[focusedIndex] || filteredColleges[0];
                        if (target) {
                          setCollegeId(target.collegeId);
                        }
                      } else if (e.key === "Escape") {
                        setCollegeSearch("");
                      }
                    }}
                    placeholder="Search by college name, code, or city (e.g. DSATM, RVCE, Belagavi)..."
                    className="w-full pl-10 pr-9 py-2.5 bg-white/[0.05] border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition shadow-inner"
                    autoFocus
                  />
                  {collegeSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setCollegeSearch("");
                        setFocusedIndex(0);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* Selected College Quick Badge */}
                {currentCollegeName && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-xs text-purple-300">
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="size-4 shrink-0 text-purple-400" />
                      <span className="truncate">Selected: <strong className="text-white">{currentCollegeName}</strong></span>
                    </div>
                    <Check className="size-4 text-emerald-400 shrink-0" />
                  </div>
                )}

                {/* Results List */}
                <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                  {filteredColleges.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400 rounded-xl border border-white/5 bg-white/[0.02]">
                      <p className="font-semibold text-gray-300">No colleges match &ldquo;{collegeSearch}&rdquo;</p>
                      <p className="text-[11px] mt-1 text-gray-500">Try searching by institution abbreviation (e.g. DSATM, SIT, BIT) or city name.</p>
                    </div>
                  ) : (
                    filteredColleges.map((col, idx) => {
                      const isSelected = collegeId === col.collegeId;
                      const isFocused = focusedIndex === idx;
                      return (
                        <div
                          key={col.collegeId}
                          onClick={() => {
                            setCollegeId(col.collegeId);
                            setFocusedIndex(idx);
                          }}
                          onMouseEnter={() => setFocusedIndex(idx)}
                          className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "bg-purple-600/20 border-purple-500 text-white font-bold shadow-sm shadow-purple-500/20"
                              : isFocused
                              ? "bg-white/[0.08] border-white/20 text-white"
                              : "bg-white/[0.03] border-white/10 text-gray-300 hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="space-y-0.5 truncate pr-2">
                            <span className="text-xs sm:text-sm block truncate">{col.collegeName}</span>
                            <span className="text-[10px] text-gray-400 block">{col.location || "Karnataka"}</span>
                          </div>
                          {isSelected ? (
                            <div className="size-5 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/40">
                              <Check className="size-3.5 text-purple-300" />
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-500 shrink-0 font-mono">#{col.collegeId}</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Q2: ENGINEERING BRANCH */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Question 2 of 9</span>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white">What is your engineering branch?</h1>
                  <p className="text-xs text-gray-400">Maps your exact branch curriculum, career pathways, and academic context.</p>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-[340px] overflow-y-auto pr-1">
                  {engineeringBranches.map((branch) => {
                    const isSelected =
                      branch.id === "other"
                        ? isOtherBranch
                        : !isOtherBranch && specializationBranch === branch.name;
                    return (
                      <div
                        key={branch.code}
                        onClick={() => {
                          if (branch.id === "other") {
                            setIsOtherBranch(true);
                            setSpecializationBranch("Other / Specialized Engineering Branch");
                          } else {
                            setIsOtherBranch(false);
                            setSpecializationBranch(branch.name);
                          }
                        }}
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-purple-600/20 border-purple-500 text-white font-bold shadow-sm shadow-purple-500/10"
                            : "bg-white/[0.03] border-white/10 text-gray-300 hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-semibold block">{branch.name}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
                              {branch.code}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 block">{branch.desc}</span>
                        </div>
                        {isSelected && <Check className="size-4 text-purple-400 shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                {isOtherBranch && (
                  <div className="p-3.5 rounded-xl border border-purple-500/40 bg-purple-950/20 space-y-1.5">
                    <label className="text-xs font-semibold text-purple-300 block">
                      Enter your exact branch or specialization:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CSE (Cyber Security), AI & Data Science, Robotics..."
                      value={customBranch}
                      onChange={(e) => setCustomBranch(e.target.value)}
                      className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                    />
                    <p className="text-[11px] text-gray-400">
                      Your custom branch will flow directly into curriculum matching, AI Mentor context, and learning resource recommendations.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Q3: SEMESTER */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Question 3 of 9</span>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white">Which semester are you in?</h1>
                  <p className="text-xs text-gray-400">Ensures your active syllabus matches your current semester.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {semesterList.map((s) => {
                    const isSelected = semester === s.sem;
                    return (
                      <div
                        key={s.sem}
                        onClick={() => setSemester(s.sem)}
                        className={`p-3 rounded-xl border transition cursor-pointer space-y-1 ${
                          isSelected
                            ? "bg-purple-600/20 border-purple-500 text-white font-bold"
                            : "bg-white/[0.03] border-white/10 text-gray-300 hover:bg-white/[0.06]"
                        }`}
                      >
                        <span className="text-xs font-bold block text-white">{s.label}</span>
                        <span className="text-[10px] text-gray-400 block">{s.badge}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Q4: EVALUATION SCHEME */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Question 4 of 9</span>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white">Evaluation & scheme type?</h1>
                  <p className="text-xs text-gray-400">Adjusts internal CIE marks rubrics and question paper formats.</p>
                </div>
                <div className="space-y-2.5">
                  {evaluationTypes.map((ev) => {
                    const isSelected = evalType === ev.id;
                    return (
                      <div
                        key={ev.id}
                        onClick={() => setEvalType(ev.id)}
                        className={`p-4 rounded-2xl border transition cursor-pointer space-y-1.5 ${
                          isSelected
                            ? "bg-purple-600/20 border-purple-500 text-white"
                            : "bg-white/[0.03] border-white/10 text-gray-300 hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white">{ev.title}</span>
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold uppercase">
                            {ev.badge}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">{ev.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Q5: CAREER GOAL */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Question 5 of 9</span>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white">What is your primary goal?</h1>
                  <p className="text-xs text-gray-400">Personalizes your Semester 1 to 8 visual milestone tree.</p>
                </div>
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {careerGoals.map((cg) => {
                    const isSelected =
                      cg.id === "other_goal"
                        ? isOtherCareerGoal
                        : !isOtherCareerGoal && careerGoal === cg.id;
                    const IconComponent = cg.icon;
                    return (
                      <div
                        key={cg.id}
                        onClick={() => {
                          if (cg.id === "other_goal") {
                            setIsOtherCareerGoal(true);
                            setCareerGoal("other_goal");
                          } else {
                            setIsOtherCareerGoal(false);
                            setCareerGoal(cg.id);
                          }
                        }}
                        className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center gap-3.5 ${
                          isSelected
                            ? "bg-purple-600/20 border-purple-500 text-white shadow-sm shadow-purple-500/10"
                            : "bg-white/[0.03] border-white/10 text-gray-300 hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="size-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                          <IconComponent className="size-4" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs sm:text-sm font-bold text-white block">{cg.title}</span>
                          <p className="text-[11px] text-gray-400 leading-tight">{cg.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {isOtherCareerGoal && (
                  <div className="p-3.5 rounded-xl border border-purple-500/40 bg-purple-950/20 space-y-1.5">
                    <label className="text-xs font-semibold text-purple-300 block">
                      Enter your custom career track / target role:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Game Development, Quantitative Finance, Security Architect..."
                      value={customCareerGoal}
                      onChange={(e) => setCustomCareerGoal(e.target.value)}
                      className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                    />
                    <p className="text-[11px] text-gray-400">
                      We will synthesize a resource-first career roadmap and inform your AI Mentor of this target role.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Q6: PROGRAMMING LEVEL */}
            {step === 6 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Question 6 of 9</span>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white">Coding experience level?</h1>
                  <p className="text-xs text-gray-400">We will tailor your daily programming exercises accordingly.</p>
                </div>
                <div className="space-y-2">
                  {programmingLevels.map((lvl) => {
                    const isSelected = progLevel === lvl.id;
                    return (
                      <div
                        key={lvl.id}
                        onClick={() => setProgLevel(lvl.id)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-purple-600/20 border-purple-500 text-white"
                            : "bg-white/[0.03] border-white/10 text-gray-300 hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs sm:text-sm font-bold text-white block">{lvl.title}</span>
                          <p className="text-[11px] text-gray-400">{lvl.desc}</p>
                        </div>
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold">
                          {lvl.xp}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Q7: PREFERRED LANGUAGE */}
            {step === 7 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Question 7 of 9</span>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white">Preferred guidance language?</h1>
                  <p className="text-xs text-gray-400">AI Senior Mentor can explain tough VTU derivations in your native language.</p>
                </div>
                <div className="space-y-2.5">
                  {languagesList.map((lang) => {
                    const isSelected = prefLang === lang.id;
                    return (
                      <div
                        key={lang.id}
                        onClick={() => setPrefLang(lang.id)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-purple-600/20 border-purple-500 text-white"
                            : "bg-white/[0.03] border-white/10 text-gray-300 hover:bg-white/[0.06]"
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-semibold">{lang.native}</span>
                        {isSelected && <Check className="size-4 text-purple-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Q8: DAILY STUDY TIME */}
            {step === 8 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Question 8 of 9</span>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white">Daily study commitment?</h1>
                  <p className="text-xs text-gray-400">Configures your daily Mission Control task size.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {studyTimeOptions.map((st) => {
                    const isSelected = studyTime === st.id;
                    return (
                      <div
                        key={st.id}
                        onClick={() => setStudyTime(st.id)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer space-y-1 ${
                          isSelected
                            ? "bg-purple-600/20 border-purple-500 text-white"
                            : "bg-white/[0.03] border-white/10 text-gray-300 hover:bg-white/[0.06]"
                        }`}
                      >
                        <span className="text-xs font-bold text-white block">{st.title}</span>
                        <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded inline-block">
                          {st.tag}
                        </span>
                        <p className="text-[11px] text-gray-400 leading-tight pt-1">{st.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Q9: TECH INTERESTS */}
            {step === 9 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Question 9 of 9</span>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white">What tech domains excite you?</h1>
                  <p className="text-xs text-gray-400">Select 1 or more interests for hackathon teammate alerts.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {interestsList.map((intr) => {
                    const isSelected = selectedInterests.includes(intr.id);
                    return (
                      <div
                        key={intr.id}
                        onClick={() => toggleInterest(intr.id)}
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-purple-600/20 border-purple-500 text-white font-bold"
                            : "bg-white/[0.03] border-white/10 text-gray-300 hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs block text-white">{intr.label}</span>
                          <span className="text-[10px] text-gray-400 block">{intr.tag}</span>
                        </div>
                        {isSelected && <Check className="size-4 text-purple-400 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CONTINUE BUTTON */}
            <div className="pt-4">
              <button
                onClick={handleNext}
                className="w-full flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-sm font-bold text-white shadow-lg shadow-purple-600/30 hover:from-purple-500 hover:to-indigo-500 cursor-pointer transition"
              >
                <span>{step === totalSteps ? "Generate Mission Control" : "Continue"}</span>
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/10 bg-[#06070a] py-3 text-center text-xs text-gray-500 px-4">
        CampusOS 60s Freshers Onboarding • Duolingo Momentum + Notion Calm
      </footer>
    </main>
  );
}

export default function FreshersOnboarding() {
  return (
    <ProtectedRoute>
      <OnboardingContent />
    </ProtectedRoute>
  );
}
