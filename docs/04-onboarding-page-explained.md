# `app/onboarding/page.tsx`

## Purpose of this file

`app/onboarding/page.tsx` is the interactive **Student Onboarding Flow** component for **CampusLit** at route `/onboarding`.

It exists to:
1. **Guide New Students Through Account Setup**: Walk first-year engineering students through a 4-step wizard collecting essential profile data.
2. **Configure Custom Academic Schemes**: Determine whether the student follows VTU Affiliated rules or Autonomous College credit rubrics.
3. **Set Academic Targets**: Capture target SGPA and attendance buffer preferences.
4. **Initialize Skill Roadmaps**: Align the workspace with the student's primary career aspiration (SDE, AI/ML, Core Engineering, Higher Studies).

---

## Execution Flow

1. **Route Navigation**: User navigates to `/onboarding` via the header or hero button.
2. **SSR Pre-render**: Next.js renders the initial step container on the server.
3. **Client Hydration**: React initializes state variables (`step`, `selectedCollege`, `selectedBranch`, `targetSgpa`).
4. **Wizard Navigation**: The user completes each step sequentially. Step progression triggers validation rules before unlocking subsequent steps.
5. **Completion State**: Upon step 4 completion, the component renders a summary preview confirming profile initialization.

---

## Imports

* `"use client"`: Enables client-side state hooks (`useState`) and click handlers.
* `import Link from "next/link"`: Next.js client-side route navigation component.
* `import { Building2, BookOpen, ... } from "lucide-react"`: Vector icon set for wizard UI steps.

---

## Architecture & Code Walkthrough

### State Architecture
* **`step` (`useState(1)`)**: Controls current step in the onboarding flow (1 to 4).
* **`selectedCollege` (`useState("")`)**: Selected institution string.
* **`selectedBranch` (`useState("cse")`)**: Selected engineering branch ID.
* **`selectedSem` (`useState(1)`)**: Active academic semester number.
* **`evalType` (`useState("vtu")`)**: Evaluation scheme (`vtu` or `autonomous`).
* **`targetSgpa` (`useState(8.5)`)**: Target SGPA target slider.
* **`primaryGoal` (`useState("sde")`)**: Selected career focus ID.

---

## Interview Questions & Key Concepts

### Q1: Why use a single multi-step state variable (`step`) instead of separate route pages (`/onboarding/step-1`)?
**Answer**: Single-page multi-step state provides smooth animation transitions, instant step navigation without network latency, and simple form state retention in local memory without requiring query parameters or complex store state.

### Key Concepts
* **Wizard UI Pattern**: Dividing long forms into manageable steps.
* **Conditional Rendering**: Displaying step-specific inputs dynamically based on `step === N`.
* **State Preservation**: Retaining user inputs across backward and forward step transitions.
