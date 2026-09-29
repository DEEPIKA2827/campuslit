# Recommended Folder Structure: CampusLit

## Current vs. Production Target Structure

To ensure CampusLit scales smoothly as backend integration and team size grow, the codebase follows a modular, feature-oriented production structure.

---

## Directory Organization

```
campuslit/
│
├── app/                          # Next.js App Router Pages & Layouts
│   ├── ai-mentor/                # AI Academic Mentor Module
│   │   └── page.tsx
│   ├── onboarding/               # 4-Step Student Onboarding Wizard
│   │   └── page.tsx
│   ├── opportunities/            # Hackathons & Internship Aggregator
│   │   └── page.tsx
│   ├── roadmap/                  # Technical Skill Progression Roadmap
│   │   └── page.tsx
│   ├── scholarships/             # Karnataka Scholarship Finder
│   │   └── page.tsx
│   ├── favicon.ico               # Application Favicon
│   ├── globals.css               # Global Styles, Tokens & Tailwind v4
│   ├── layout.tsx                # Root Layout Shell & Metadata Export
│   └── page.tsx                  # Landing Page & Interactive Simulator
│
├── components/                   # Reusable React UI Components (Target)
│   ├── ui/                       # Primitive UI Atoms (Buttons, Cards, Badges)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── badge.tsx
│   ├── modules/                  # Feature Modules
│   │   ├── simulator/            # Attendance & CIE Calculator Components
│   │   ├── onboarding/           # Onboarding Wizard Steps
│   │   └── mockups/              # OS Window Mockup Components
│   └── layout/                   # Layout Structures (Navbar, Footer, Sidebar)
│       ├── navbar.tsx
│       └── footer.tsx
│
├── lib/                          # Helper Utilities & Calculations (Target)
│   ├── utils.ts                  # Classname merger (cn) & formatting helpers
│   ├── math/                     # Attendance & SGPA calculation logic
│   │   ├── attendance.ts
│   │   └── sgpa.ts
│   └── constants/                # Colleges, Branches, Schemes Data
│       ├── colleges.ts
│       └── branches.ts
│
├── docs/                         # Technical Documentation & Walkthroughs
│   ├── 01-page-tsx-explained.md
│   ├── 02-layout-tsx-explained.md
│   ├── 03-globals-css-explained.md
│   ├── ARCHITECTURE.md
│   ├── CHANGELOG.md
│   ├── FOLDER_STRUCTURE.md
│   ├── LEARNING_NOTES.md
│   ├── PROJECT_OVERVIEW.md
│   └── UI_DESIGN_SYSTEM.md
│
├── public/                       # Public Static Assets & Media
│
├── .gitignore                    # Git Exclusion Rules
├── CHANGELOG.md                  # Project Version History
├── next.config.ts                # Next.js Build Configuration
├── package.json                  # Package Manifest & Scripts
├── tsconfig.json                 # TypeScript Compiler Options
└── README.md                     # Main Repository README
```

---

## File Naming Conventions

1. **Routes & Pages**: Lowercase hyphenated subfolders containing `page.tsx` (`app/ai-mentor/page.tsx`).
2. **Components**: PascalCase filenames (`components/ui/Button.tsx` or `components/modules/CieCalculator.tsx`).
3. **Utilities & Libraries**: camelCase filenames (`lib/utils.ts`, `lib/math/attendance.ts`).
4. **Documentation**: Uppercase markdown files for root docs (`README.md`, `CHANGELOG.md`) and numbered walkthrough files in `docs/` (`01-page-tsx-explained.md`).
