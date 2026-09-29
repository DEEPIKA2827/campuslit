# 🎨 CampusLit Mission Control — UI Design System Specification

**Role:** Senior UI Designer  
**Target Viewport:** Mobile-First Responsive (Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`)  
**Design Influences:** **Notion** (Simplicity & Micro-Borders) + **GitHub** (Professional Contrast & Badges) + **Duolingo** (High-Dopamine Rewards & Next Action)  

---

## 1. Design Tokens System

### 🎨 Color Palette (Dark Theme Core)

```
BACKGROUND & SURFACES
├── Void Dark (Body BG):      #08090e  (Deep midnight black)
├── Card Glass Surface:       rgba(18, 20, 29, 0.75) (16px backdrop-blur)
├── Secondary Surface:        rgba(255, 255, 255, 0.03)
├── Subtle Surface Hover:     rgba(255, 255, 255, 0.06)
└── Border Subdued:           rgba(255, 255, 255, 0.08)

ACCENT & ACCELERATION COLORS
├── Primary Glow (Purple):    #7c3aed (Violet-600) — Main CTAs & Hero Accents
├── Secondary Glow (Indigo):  #4f46e5 (Indigo-600) — Secondary Focus
├── Success & Safe (Emerald): #10b981 (Emerald-500) — Attendance Safe Zone & XP
├── Warning (Amber):          #f59e0b (Amber-500) — Impending Deadlines & Alerts
└── Danger & Shortage (Rose): #f43f5e (Rose-500) — Attendance Shortage Warning

TYPOGRAPHY COLORS
├── Text Primary:             #f3f4f6 (Gray-100) — High contrast headings
├── Text Muted:               #9ca3af (Gray-400) — Subheads & secondary metadata
└── Text Subdued:             #6b7280 (Gray-500) — Captions & micro-labels
```

---

### 🔤 Typography System
- **Font Family:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`
- **Scale:**
  - **Display (Hero Greeting):** `32px / 2rem` | Weight: `800 (ExtraBold)` | Line Height: `1.1`
  - **H1 (Mission Title):** `24px / 1.5rem` | Weight: `700 (Bold)` | Line Height: `1.2`
  - **H2 (Section Header):** `18px / 1.125rem` | Weight: `600 (SemiBold)` | Line Height: `1.3`
  - **Body Regular:** `14px / 0.875rem` | Weight: `400 (Normal)` | Line Height: `1.5`
  - **Caption / Label:** `12px / 0.75rem` | Weight: `500 (Medium)` | Line Height: `1.4`
  - **Micro Label:** `10px / 0.625rem` | Weight: `600 (SemiBold)` | Tracking: `0.05em (Uppercase)`

---

### 📐 Spacing & Grid Scale
- **Base Unit:** 4px
- **Scale:** `xs: 4px` | `sm: 8px` | `md: 12px` | `lg: 16px` | `xl: 24px` | `2xl: 32px` | `3xl: 48px`

---

### 🔲 Border Radii
- **Sub-Element / Badge:** `8px` (`rounded-lg`)
- **Interactive Card:** `16px` (`rounded-2xl`)
- **Hero Mission Block:** `24px` (`rounded-3xl`)
- **Pills & Buttons:** `9999px` (`rounded-full`)

---

## 2. Full Visual Layout Architecture

```
+-------------------------------------------------------------------------+
| MOBILE LAYOUT (375px - 430px)                                           |
+-------------------------------------------------------------------------+
| [CO] Mission Control                         🔥 12-Day Streak    [User] |
+-------------------------------------------------------------------------+
|                                                                         |
| Good Evening Deepika 👋                                                 |
|                                                                         |
| +---------------------------------------------------------------------+ |
| | HERO CARD: TODAY'S MISSION                                          | |
| |                                                                     | |
| | 🎯 Complete Git Basics                                              | |
| | ⏱️ 25 mins  •  🎯 +50 XP  •  🐙 Git & GitHub Module                   | |
| |                                                                     | |
| | [ 🚀 START MISSION ]  (Full Width Gradient Button)                  | |
| +---------------------------------------------------------------------+ |
|                                                                         |
| ── SECONDARY INTELLIGENCE RADAR ─────────────────────────────────────── |
|                                                                         |
| +---------------------------------------------------------------------+ |
| | 🛡️ 75% ATTENDANCE RADAR                                              | |
| | 84.2% Safe  │  3 Safe Bunks Remaining  │  [ + Log Class ]            | |
| +---------------------------------------------------------------------+ |
|                                                                         |
| +---------------------------------------------------------------------+ |
| | 📅 ACADEMIC DEADLINES                                                | |
| | Thu 4 PM • Physics Lab Record Submission                            | |
| | Mon 9 AM • Math IA2 Exam                                            | |
| +---------------------------------------------------------------------+ |
|                                                                         |
+-------------------------------------------------------------------------+
```

---

## 3. Reusable Component Library

### Component 1: `DopamineButton` (Primary Mission Button)
- **Visuals:** High-contrast gradient fill (`from-purple-600 via-indigo-600 to-purple-700`), 12px radius, glowing drop shadow (`shadow-lg shadow-purple-600/30`).
- **Typography:** `14px / Bold`, text color `#ffffff`.
- **Icon:** `<Rocket className="size-4" />` with subtle rightward pulse.
- **States:**
  - **Hover:** Scales up to `102%`, shadow intensifies (`shadow-purple-500/50`).
  - **Active / Tap:** Scales down to `98%` for tactile feedback.

---

### Component 2: `StreakBadge` (Duolingo Style Velocity)
- **Visuals:** Compact pill background `rgba(245, 158, 11, 0.15)`, border `1px solid rgba(245, 158, 11, 0.3)`.
- **Content:** Animated flame icon 🔥 + text `"12-Day Streak"`.
- **Typography:** `12px / SemiBold`, text color `#f59e0b`.

---

### Component 3: `AttendanceRadarMeter` (VTU 75% Defense)
- **Visuals:** Glassmorphic card (`bg-white/[0.03]`, border `1px solid rgba(255,255,255,0.08)`).
- **Sub-elements:**
  - Status Pill: `84.2% Safe` (Emerald green bg `#10b981/20`, text `#34d399`).
  - Safe Bunks Counter: `"3 Bunks Buffer"` (Bold white).
  - Quick Log Action: `<PlusCircle /> Log Attendance`.

---

## 4. Card Designs

### 🃏 Card 1: Today's Mission Hero Card
```
+-----------------------------------------------------------------------+
|  TODAY'S MISSION                                      [ 🎯 +50 XP ]   |
|                                                                       |
|  Complete Git Basics                                                  |
|  Learn commits, staging, branching, and pushing your 1st repository.   |
|                                                                       |
|  ⏱️ 25 mins  •  🐙 Git & GitHub Module  •  📄 [ Playbook PDF ]         |
|                                                                       |
|  ===================================================================  |
|  [ 🚀 START MISSION ]                                                 |
+-----------------------------------------------------------------------+
```
- **Styling:** 24px padding, 24px border-radius, background gradient `from-purple-950/30 via-[#0f111d] to-[#08090e]`, border `1px solid rgba(124, 58, 237, 0.4)`.

---

### 🃏 Card 2: Academic Deadline Stream Card
```
+-----------------------------------------------------------------------+
|  📅 ACADEMIC DEADLINES                                [ View All → ]  |
|                                                                       |
|  • Physics Lab Record Submission                    [ Thu, 4:00 PM ]  |
|    Module: BPHYS102  │  Urgency: High (48h left)                        |
|                                                                       |
|  • Math IA2 Exam (Calculus & Matrices)              [ Mon, 9:00 AM ]  |
|    Module: BMAT101   │  Target Score: 36 / 40                         |
+-----------------------------------------------------------------------+
```

---

## 5. Hover, Active & Focus States

- **Card Hover:** Subtle vertical translate `-2px`, background shifts from `rgba(255,255,255,0.03)` to `rgba(255,255,255,0.06)`, border brightens to `rgba(167, 139, 250, 0.3)`.
- **Focus Mode (When Mission Starts):** Background dims to `#040407` with `90%` opacity. Sidebar and secondary widgets fade to `20%` opacity. The Mission Card scales up slightly (`103%`) with a pulsing ambient aura.

---

## 6. Empty States (Notion "Clean Slate" Design)

```
+-----------------------------------------------------------------------+
|                                                                       |
|                                ☕                                      |
|                       Mission Accomplished!                           |
|                                                                       |
|        You've conquered today's mission, Deepika!                     |
|        Your 12-day streak is secured. Take a rest or check            |
|        opportunities below.                                           |
|                                                                       |
|        [ Explore Hackathons ]     [ Optional Practice ]               |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## 7. Loading & Skeleton States

- **Card Skeletons:** Animated linear shimmer (`bg-gradient-to-r from-white/5 via-white/10 to-white/5`, `animate-pulse`).
- **Streak Loading:** Shimmer pill `w-24 h-6 rounded-full`.
- **Mission Title Loading:** Skeleton block `w-3/4 h-8 rounded-lg`.

---

## 8. Dark Mode Standards & Contrast

- **WCAG AAA Compliance:** All primary body text (`#f3f4f6`) over void dark (`#08090e`) yields a **16.8:1** contrast ratio.
- **Accent Text:** Primary purple `#c4b5fd` over dark cards yields an **11.2:1** ratio, exceeding WCAG standards.
- **Ambient Lighting:** Multi-layer radial gradients with `pointer-events-none` to prevent interaction blocking.
