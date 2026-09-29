# 🚀 CampusLit — Mission Control UX Specification

**Designed by:** Head of Product  
**Target Screen:** Mission Control (`/dashboard` → **Mission Control**)  
**Target Persona:** Engineering Student opening CampusLit at any time of day  
**Product Philosophy:** **Dopamine-Driven Single Action** (Duolingo / Gaming Quest) + **Notion** (Calm Slate) + **Linear** (Precision Focus)  

---

## 1. The Core Philosophy: From "Dashboard" to "Mission Control"

> *"A dashboard shows data. Mission Control commands action."*

When Deepika opens CampusLit at 8:00 AM or 8:00 PM, she shouldn't see a clutter of analytical cards. She should see **one singular, high-dopamine mission** that makes starting impossible to resist.

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│   Good Evening Deepika 👋                              │
│                                                        │
│   TODAY'S MISSION                                      │
│                                                        │
│   Complete Git Basics                                  │
│   ⏱️ 25 mins • 🎯 +50 XP                               │
│                                                        │
│   [ 🚀 START MISSION ]                                 │
│                                                        │
└────────────────────────────────────────────────────────┘
```

Everything else — attendance radar, deadlines, senior playbooks — becomes secondary collapsible intelligence under Mission Control.

---

## 2. The 3 Rules of Mission Control

1. **Rule of One:** Only ONE active primary mission is presented at a time. No choice paralysis.
2. **Instant Dopamine:** Time estimate + reward badge + single prominent `[ START MISSION ]` button.
3. **Calm Secondary Drawers:** Secondary stats (75% Attendance Radar, Deadlines) recede into subtle, non-intrusive drawers below the fold.

---

## 3. Desktop & Mobile Wireframe Layout

### Mobile Wireframe (Single-Column Focus Screen)

```
┌────────────────────────────────────────┐
│ [CO] Mission Control       🔥 12   👤   │
├────────────────────────────────────────┤
│                                        │
│  Good Evening Deepika 👋               │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │  TODAY'S MISSION                   │ │
│ │                                    │ │
│ │  Complete Git Basics               │ │
│ │  ⏱️ 25 mins • 🎯 +50 XP • 🐙 Git    │ │
│ │                                    │ │
│ │  [ 🚀 START MISSION ]              │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ─── SECONDARY INTELLIGENCE ──────────  │
│                                        │
│ 🛡️ Attendance Radar: 84% (Safe)       │
│ 📅 Next Deadline: Physics Lab (Thu)    │
│ 🧠 Skill Path: C & Git Mastery        │
│                                        │
└────────────────────────────────────────┘
```

### Desktop Wireframe (Centric Focus Architecture)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TOP BAR: [Logo CO] Mission Control  │  [RVCE 2025 Scheme]  │  🔍 ⌘K Quick Search  │  🔥 12-Day Streak  👤│
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                        │
│                                      Good Evening Deepika 👋                                           │
│                                                                                                        │
│ ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ TODAY'S MISSION                                                                                    │ │
│ │                                                                                                    │ │
│ │ Complete Git Basics                                                                                │ │
│ │ ⏱️ 25 mins  •  🎯 +50 XP  •  🐙 Git & GitHub Module  •  📄 [ Senior Playbook Attached ]            │ │
│ │                                                                                                    │ │
│ │ [ 🚀 START MISSION ]                                                                               │ │
│ └────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                        │
│ ───────────────────────────────── SECONDARY INTELLIGENCE RADAR ─────────────────────────────────────── │
│                                                                                                        │
│ ┌─────────────────────────────┐  ┌─────────────────────────────┐  ┌─────────────────────────────────┐ │
│ │ 🛡️ 75% Attendance Radar     │  │ 📅 Academic Deadlines       │  │ 💡 Senior Intel Tip             │ │
│ │ 84% Safe • 3 Bunks Left     │  │ Thu: Physics Lab Record     │  │ "C Lab External Viva prefers    │ │
│ │ [ Log Attendance + ]        │  │ Mon: Math IA2 Exam          │  │  Pointers call-by-reference."   │ │
│ └─────────────────────────────┘  └─────────────────────────────┘  └─────────────────────────────────┘ │
│                                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. User Interaction & Dopamine Loop

1. **Opening Mission Control:**
   - Personalized time-aware greeting (*"Good Morning / Afternoon / Evening Deepika 👋"*).
   - Streak counter glows (`🔥 12-Day Streak`).

2. **Clicking `[ 🚀 START MISSION ]`:**
   - Screen dims into **Focus Mode** (hides all sidebar & distraction elements).
   - Launches a 25-minute timer with attached learning resources / notes.

3. **Completing the Mission:**
   - Triggers an instant celebratory confetti burst.
   - Streak increments (`🔥 13-Day Streak`).
   - Sound effect / haptic feedback: *"Mission Accomplished! +50 XP"*.
   - Reveals optional secondary mission or clean state: *"You've conquered today's mission, Deepika! Rest or explore opportunities below."*

---

## 5. Secondary Intelligence Radar (Below the Fold)

Below the main Mission Card, students can expand 3 secondary modules when needed:
- **🛡️ Attendance Radar:** Quick tap `+ Log Class` to update safe bunk allowance.
- **📅 Deadline Stream:** Chronological countdown of upcoming IA tests & lab submissions.
- **💡 Senior Intel:** Verified campus hacks from 3rd/4th-year seniors.
