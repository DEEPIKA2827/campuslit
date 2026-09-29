# 📄 CampusLit — Executive Product Draft & Review Guide

**Document Target:** Senior Mentor / Investor / Advisory Review  
**Project Name:** CampusLit — *The Operating System for Engineering Students*  
**Target Audience:** First-Year Engineering Students in Karnataka (VTU & Autonomous Colleges)  
**Live Prototype URL:** [http://localhost:3000](http://localhost:3000)  

---

## 1. Executive Summary (The 30-Second Pitch)

Every year, over 100,000 students join engineering colleges across Karnataka (RVCE, BMSCE, PES, MSRIT, KLS GIT, NIE, VTU main campus, etc.). From Day 1, they face immense information chaos: essential notes, exam dates, and lab record formats are buried across **40+ unorganized WhatsApp groups**, Telegram channels, and confusing college portals.

**CampusLit** replaces this chaos with a single, calm operating system. It gives every student a personalized, semester-by-semester roadmap, an automated **75% VTU attendance & exam risk calculator**, verified senior lab viva playbooks, and an opportunity radar for hackathons and scholarships.

---

## 2. The Core Problem & Solution

### ❌ The Problem Students Face
1. **Information Chaos:** Important exam notices and notes are lost in 500+ daily chat forwards.
2. **Detention & Attendance Panic:** Students don't know if they are falling below the mandatory **75% VTU attendance cutoff** until detention notices are issued.
3. **CIE Exam Uncertainty:** Internal Assessment (IA) marks are calculated on loose sheets without clear targets for distinction or pass scores.
4. **Senior Guidance Vacuum:** First-year freshers struggle to get reliable advice on lab viva questions and coding roadmaps.

### ✅ The CampusLit Solution
1. **Single Operating Command Center:** Replaces 40+ chat groups with 1 calm workspace.
2. **Predictive 75% Attendance Radar:** Tells students exactly how many safe class bunks they have left before hitting detention risk.
3. **Verified Senior Playbooks:** Provides 100% vetted lab record cheat sheets and viva Q&As from top 3rd/4th-year students.
4. **Dopamine-Driven Daily Action:** Turns chaotic college work into a single **"Today's Mission"** (e.g. *Finish C Pointers Lab Record, 25 mins*).

---

## 3. The Complete User Journey (How a Student Uses CampusLit)

```
[1. Landing Page] ────────► [2. 60s Freshers Onboarding] ────────► [3. Mission Control]
Discovers CampusLit &        Answers 9 quick setup questions        Receives Today's Mission
tries live VTU calculator   (College, Branch, Sem, Goal)            & 75% Attendance Radar
                                                                           │
                                                                           ▼
[6. AI Senior Copilot] ◄──── [5. Opportunity Radar] ◄──────── [4. Navigator Hub]
Asks AI for VTU math        Discovers hackathons, grants           Explores Sem 1-8 visual
derivations & C debugging   & finds college teammates              milestone roadmap tree
```

---

## 4. Screen-by-Screen Walkthrough (What Has Been Built)

Here is the complete walkthrough of the live prototype built so far:

### 🏠 Screen 1: The Landing Page (`http://localhost:3000/`)
* **Purpose:** Introduces CampusLit with modern dark SaaS aesthetics (inspired by Linear & Vercel).
* **Key Features:**
  - **Hero Section:** High-contrast headline *"Stop Chasing Notes. Start Owning Your Engineering Degree."*
  - **Interactive Workspace Preview:** 4 clickable tabs showcasing Academics, Attendance, Seniors, and Skill Roadmaps.
  - **Live VTU Attendance & SGPA Calculator Tool:** Students can drag sliders for attendance % and target SGPA to test safe bunk calculations right on the page.
  - **Waitlist Form:** Allows students to select their college & branch to request early access.

### 🚀 Screen 2: 60-Second Freshers Onboarding (`http://localhost:3000/onboarding`)
* **Purpose:** Personalizes the entire platform in under 60 seconds (inspired by Duolingo).
* **Key Features:**
  - **9 Quick Questions:** College, Branch, Semester, VTU vs. Autonomous scheme, Career Goal, Programming Experience, Preferred Language (English/Kannada/Hindi), Daily Study Commitment, and Tech Interests.
  - **Progress Bar & XP Counter:** Displays step progress and awards `+100 XP` upon completion.
  - **Mission Reveal Card:** Shows a customized configuration summary and launches Mission Control.

### 🏠 Screen 3: Mission Control Dashboard (`http://localhost:3000/#demo`)
* **Purpose:** The daily morning focus screen. Gives the student total clarity on what to do today.
* **Key Features:**
  - **Personalized Greeting:** *"Good Evening Deepika 👋"*
  - **Today's Mission Hero Card:** Single focus task (*"Complete Git Basics • 25 mins"*) with a `[ 🚀 START MISSION ]` button.
  - **75% Attendance Radar:** Displays overall attendance % and exact safe bunk allowance (e.g. *"84% Safe • 3 Bunks Buffer"*).

### 🧭 Screen 4: Navigator / Roadmap Hub (`http://localhost:3000/roadmap`)
* **Purpose:** Visual, interactive milestone tree mapping Sem 1 to Graduation (inspired by roadmap.sh).
* **Key Features:**
  - **4 Filter Selectors:** College, Branch, Semester, and Career Goal.
  - **Connected Node Tree:** Interactive nodes color-coded by status (`Completed`, `In Progress`, `Locked`).
  - **Node Inspector Modal:** Clicking any node reveals detailed topics, attached senior notes, and resource links.
  - **6 Output Tabs:** Learning Tree, Proof-of-Work Projects, Academic Resources, Certifications, DSA Track, and Resume Checklist.

### 🎯 Screen 5: Opportunity Radar (`http://localhost:3000/opportunities`)
* **Purpose:** Discovery hub for internships, hackathons, scholarships, and campus placement drives.
* **Key Features:**
  - **7 Category Tabs:** Filter by Internships, Hackathons, Scholarships, Competitions, Open Source, and Campus Drives.
  - **Eligibility Filters:** Filter by Location (Remote/On-site KA), Batch Year (2025-2028), CGPA requirement, and Stipend.
  - **Teammate Matchmaker Modal:** Connects students with peers from RVCE, BMSCE, PES, or MSRIT for upcoming hackathons.

### 💰 Screen 6: Grant Radar / Scholarship Hub (`http://localhost:3000/scholarships`)
* **Purpose:** Financial security portal for Karnataka government and corporate scholarships.
* **Key Features:**
  - **Karnataka & Central Grants:** Covers SSP Karnataka, NSP, AICTE Pragati for Women, Infosys STEM, Jindal Trust, and Reliance Foundation.
  - **Application Status Tracker:** Kanban bar tracking `Saved` → `Applied` → `Under Review` → `Awarded`.
  - **Deadline Reminders:** Toggle reminder alerts for closing application windows.
  - **Document Checklist Modal:** Displays required study certs and direct official portal links.

### 🤖 Screen 7: AI Senior Copilot (`http://localhost:3000/ai-mentor`)
* **Purpose:** 24/7 instant academic and coding assistant (inspired by ChatGPT).
* **Key Features:**
  - **Two-Column Layout:** Left panel for chat history; right panel for interactive conversation.
  - **Suggested Senior Prompts:** Instant chips for VTU math derivations, C pointer debugging, lab viva preparation, and resume review.
  - **VTU & Autonomous Context Locked:** Pre-configured with Karnataka syllabus and examiner habits.

---

## 5. Design System & World-Class Standards Used

- **Linear Aesthetic:** High-density dark theme (`#08090e`), crisp 1px borders (`border-white/10`), status indicators.
- **Notion Calm:** Modular blocks, clean slate typography, zero clutter.
- **Vercel Polish:** Vibrant neon purple/emerald background glows, glassmorphism backdrop filters.
- **Stripe Precision:** Rich interactive visual widgets (sliders, calculators, node trees).
- **Duolingo Dopamine:** Single next-action clarity, streak flame counters (`🔥 12-Day Streak`), and XP reward badges.

---

## 6. How to Run & Demo the Live Prototype

To demonstrate this live to your mentor:

1. **Ensure the Dev Server is Running:**
   Open a terminal in `c:\Projects\campuslit` and run:
   ```bash
   npm run dev
   ```
2. **Open in Browser:**
   Go to **[http://localhost:3000](http://localhost:3000)** in Google Chrome or Microsoft Edge.
3. **Recommended Demo Walkthrough Order:**
   - **Step 1:** Show the **Landing Page** at `http://localhost:3000` and demonstrate the live VTU Attendance & SGPA slider calculator.
   - **Step 2:** Click **"Try Onboarding Flow"** (or go to `http://localhost:3000/onboarding`) to show the 60-second setup.
   - **Step 3:** Show **Mission Control** (`Good Evening Deepika 👋` & `Today's Mission`).
   - **Step 4:** Navigate to **Navigator** (`http://localhost:3000/roadmap`) and inspect a semester node.
   - **Step 5:** Navigate to **Opportunity Radar** (`http://localhost:3000/opportunities`) and filter by Remote / Hackathons.
   - **Step 6:** Navigate to **Scholarship Hub** (`http://localhost:3000/scholarships`) and open the Document Checklist.
   - **Step 7:** Open **AI Senior Copilot** (`http://localhost:3000/ai-mentor`) and click a prompt chip.

---

## 7. Next Steps & Launch Strategy

1. **Initial Pilot:** Launch a 100-student pilot across 3 Karnataka colleges (RVCE, BMSCE, PES).
2. **Content Seeding:** Seed Sem 1 & 2 verified lab viva cheat sheets for C Programming and Physics Cycle.
3. **Viral Acquisition:** Share the free standalone VTU Attendance Calculator link across WhatsApp student groups.
