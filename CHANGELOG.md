# Changelog

All notable changes to the **CampusLit** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-08-03

### Title
**Design Prototype (v0.1.0)**

### Added
- **Landing Page (`app/page.tsx`)**:
  - Hero section featuring gradient typography, responsive badges, and social proof counters (`2,400+ Students`, `48+ Colleges`).
  - Interactive OS Window Mockup simulating a Mac window container with live tab switching (`Academic Command`, `CIE & Attendance Radar`, `Senior Playbooks`, `Skill Path`).
  - Live CIE & Attendance Risk Simulator widget with real-time sliders computing safe bunk allowances and required IA test scores.
  - Student Journey Arc and WhatsApp Chaos vs. CampusLit comparison matrix.
  - Collapsible FAQ accordion widget.
  - Student Early Access Waitlist registration form with college and branch selection.
  - Sticky glassmorphic navigation header and responsive footer.

- **Student Onboarding Flow (`app/onboarding/page.tsx`)**:
  - 4-step interactive wizard capturing student setup preferences:
    - Step 1: Institution selection (VTU Affiliated vs. Autonomous Colleges in Karnataka).
    - Step 2: Branch & Semester selection (CSE, ISE, AI/ML, ECE, EEE, Mech, Civil).
    - Step 3: Academic Target & Attendance Goal settings (Target SGPA slider, 75% threshold defense).
    - Step 4: Primary Skill Focus (Full-Stack, DSA, AI/ML, DevOps).
  - Animated step progress bar and summary preview.

- **AI Academic Mentor Interface (`app/ai-mentor/page.tsx`)**:
  - Conversational AI chat layout tailored for VTU 2022/2025 scheme queries.
  - Suggested prompt cards (`Explain BMAT101 Module 2 PYQ`, `Calculate my CIE for 8.5 SGPA`, `Lab Viva Checklist for C Lab`).
  - Chat message history interface with role-based formatting.

- **Scholarship & Financial Aid Portal (`app/scholarships/page.tsx`)**:
  - Filterable directory for SSP Karnataka, National Scholarship Portal (NSP), and private merit scholarships.
  - Deadline trackers, eligibility criteria badges, and required document checklists.

- **Opportunity & Internship Radar (`app/opportunities/page.tsx`)**:
  - Karnataka-wide hackathons, IEEE/GDSC club event alerts, and 1st-year internship listings.
  - Filter by domain (Web, AI, Core Engg) and event type (Hackathon, Workshop, Internship).

- **Skill & Career Progression Roadmap (`app/roadmap/page.tsx`)**:
  - Semester 1-8 technical skill roadmap from Git/Linux basics to LeetCode starter sets and proof-of-work project milestones.

- **Design System & Global Styling (`app/globals.css`)**:
  - Tailwind CSS v4 engine integration via `@import "tailwindcss";`.
  - `:root` design system tokens for obsidian dark background (`#08090e`), light text (`#f3f4f6`), and brand accent colors (purple, blue, cyan, emerald).
  - Custom glassmorphism panel classes (`.glass-panel`, `.glass-panel-interactive`).
  - Custom keyframe animations (`@keyframes pulseGlow`) and WebKit scrollbar styling.

- **Root Layout & Metadata (`app/layout.tsx`)**:
  - Root HTML shell with full-height flex layout and subpixel font antialiasing (`antialiased`).
  - Typed `Metadata` export defining site title and SEO description.

- **Comprehensive Documentation Suite (`docs/`)**:
  - `PROJECT_OVERVIEW.md`: Executive overview, problem statement, and scope.
  - `ARCHITECTURE.md`: High-level system architecture and data flow.
  - `FOLDER_STRUCTURE.md`: Recommended production directory layout and file conventions.
  - `UI_DESIGN_SYSTEM.md`: Comprehensive design tokens, glassmorphism rules, typography, and color palettes.
  - `LEARNING_NOTES.md`: Senior engineering insights, technical concepts, and interview prep notes.
  - `01-page-tsx-explained.md`, `02-layout-tsx-explained.md`, `03-globals-css-explained.md`, and route-specific technical walkthroughs.

---

### Fixed & Refactored (ESLint & Code Standards Cleanup)
- **Zero ESLint Warnings & Errors**:
  - **`app/ai-mentor/page.tsx`**: Resolved `react-hooks/purity` error by extracting ID and timestamp generation (`getMessageId`, `getFormattedTime`) outside component scope; removed unused `RotateCcw` and `Sliders` imports.
  - **`app/opportunities/page.tsx`**: Fixed `react/no-unescaped-entities` error by replacing unescaped double quotes with `&quot;`; purged 9 unused `lucide-react` imports (`Filter`, `Calendar`, `Award`, `CheckCircle2`, `Building2`, `Code`, `Flame`, `Globe`, `ChevronRight`).
  - **`app/roadmap/page.tsx`**: Fixed `@typescript-eslint/no-explicit-any` error by replacing explicit `any` cast with strict union type (`typeof activeTab`); purged 10 unused `lucide-react` imports.
  - **`app/scholarships/page.tsx`**: Fixed `@typescript-eslint/no-explicit-any` error by replacing explicit `any` cast with typed status union (`"saved" | "applied" | "review" | "awarded"`); purged 9 unused `lucide-react` imports and removed unused state variables (`incomeFilter`, `meritFilter`).
  - **`app/onboarding/page.tsx`**: Purged 10 unused `lucide-react` imports (`Building2`, `BookOpen`, `Target`, `Compass`, `Sparkles`, `Info`, `Clock`, `Award`, `Terminal`, `RotateCcw`).
  - **`app/page.tsx`**: Purged 8 unused `lucide-react` imports (`Calendar`, `Compass`, `GraduationCap`, `MessageSquare`, `TrendingUp`, `FileText`, `HelpCircle`, `Award`).

---

### Changed
- Refactored `package.json` dependencies to support Next.js `16.2.12` and Tailwind CSS `v4`.
