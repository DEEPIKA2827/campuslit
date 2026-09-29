# UI Design System Specification: CampusLit

## Design Philosophy

The **CampusLit Design System** is built on three core pillars:

1. **Obsidian Dark-Canvas Foundation**: A deep `#08090e` background minimizing eye strain during late-night study sessions.
2. **Glassmorphic Surface Hierarchy**: Layered translucent slate panels (`rgba(15, 17, 26, 0.75)` with `backdrop-filter: blur(16px)`) creating a modern, high-tech interface.
3. **Intentional Neon Accents**: Vibrant HSL-tailored accent colors (Purple, Blue, Cyan, Emerald) directing user attention to critical status alerts (e.g., attendance risk, distinction SGPA target).

---

## Design Tokens & CSS Variables

All core design system tokens are defined centrally in `:root` inside `app/globals.css`:

```css
:root {
  --background: #08090e;        /* Primary obsidian canvas background */
  --foreground: #f3f4f6;        /* High-contrast text foreground */
  --card-bg: rgba(18, 20, 29, 0.7); /* Translucent surface color */
  --accent-purple: #7c3aed;     /* Primary brand accent (Violet 600) */
  --accent-blue: #3b82f6;       /* Secondary brand accent (Blue 500) */
  --accent-cyan: #06b6d4;       /* AI mentor & status indicator (Cyan 500) */
  --accent-emerald: #10b981;    /* Attendance safe & success badge (Emerald 500) */
}
```

---

## Typography & Type Scale

* **Primary Font Stack**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`, `sans-serif`.
* **Font Antialiasing**: Enabled globally via `antialiased` class on root `<html>`.

| Role | Class Scale | Size | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | `text-4xl sm:text-6xl lg:text-7xl` | 36px - 72px | `1.08` | Primary landing page hero headline |
| **Section Title** | `text-2xl sm:text-4xl` | 24px - 36px | `1.2` | Feature headers & section titles |
| **Card Heading** | `text-base sm:text-lg` | 16px - 18px | `1.3` | UI card titles & modal headers |
| **Body Text** | `text-sm sm:text-base` | 14px - 16px | `1.6` | Descriptions & paragraph body |
| **Badges & Labels** | `text-[10px] sm:text-xs` | 10px - 12px | `1.4` | Status badges, tags, and small timestamps |

---

## Glassmorphism & Micro-Interactions

### 1. Static Glass Panel (`.glass-panel`)
```css
.glass-panel {
  background: rgba(15, 17, 26, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

### 2. Interactive Glass Panel (`.glass-panel-interactive`)
```css
.glass-panel-interactive {
  background: rgba(18, 20, 31, 0.65);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.glass-panel-interactive:hover {
  background: rgba(24, 27, 42, 0.85);
  border-color: rgba(167, 139, 250, 0.3);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(124, 58, 237, 0.15);
  transform: translateY(-2px);
}
```

---

## Accessibility & Contrast Basics

1. **Text Contrast**: Text colors (`#f3f4f6` foreground, `#9ca3af` secondary text) maintain minimum WCAG 2.1 AA contrast ratios against `#08090e` backgrounds.
2. **Focus Indicators**: Interactive controls use `focus:border-purple-500` and focus outline rings for keyboard navigation.
3. **Interactive Touch Targets**: Buttons and tab controls enforce minimum 44px height tap targets for mobile usability.
