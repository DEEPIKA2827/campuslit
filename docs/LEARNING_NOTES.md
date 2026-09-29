# Senior Engineering Learning Notes & Best Practices

## Architectural Lessons from CampusLit

This document captures key technical insights, senior engineering architectural decisions, and interview preparation notes derived from building **CampusLit v0.1.0**.

---

## 1. Next.js App Router Architecture

### Server Components vs. Client Components
* **Server Components (Default)**: Next.js App Router components render on the server by default. They produce zero client-side JavaScript bundle weight, execute direct database queries, and improve initial page load performance (FCP).
* **Client Components (`"use client"`)**: Opt-in components that run on the client browser DOM. Required whenever a component uses React state (`useState`), lifecycle hooks (`useEffect`), browser APIs (`window`, `localStorage`), or event listeners (`onClick`, `onChange`).

### Layout Persistence
In App Router, layout components (`app/layout.tsx`) stay mounted across page navigation. When navigating between sub-routes (`/onboarding` -> `/ai-mentor`), Next.js re-renders only the `{children}` prop. This preserves layout state (header navigation, theme state) and avoids expensive DOM re-creations.

---

## 2. React State Management & Optimization

### Derived State Pattern
A common mistake in React applications is storing calculated values inside `useState` and syncing them via `useEffect`:

```tsx
// ❌ BAD: Redundant state & async effect overhead
const [attendance, setAttendance] = useState(82);
const [bunkAllowance, setBunkAllowance] = useState(0);

useEffect(() => {
  setBunkAllowance(Math.floor((attendance - 75) / 2.5));
}, [attendance]);
```

Instead, calculate derived variables synchronously during render:

```tsx
// ✅ SENIOR PRACTICE: Derived directly during render
const [attendance, setAttendance] = useState(82);
const bunkAllowance = Math.max(0, Math.floor((attendance - 75) / 2.5));
```

**Benefits**:
1. Prevents unnecessary extra re-renders.
2. Eliminates state out-of-sync bugs.
3. Reduces code complexity.

---

## 3. Styling & Performance with Tailwind v4

* **Engine Directive (`@import "tailwindcss";`)**: Replaces legacy `@tailwind` directives in CSS files.
* **Inline Theme Mapping (`@theme inline`)**: Connects custom CSS variables (`:root`) directly to generated Tailwind utility classes (`bg-background`, `text-foreground`).
* **GPU-Accelerated Animations**: Using `transform` (`translateY(-2px)`) and `opacity` inside hover states and keyframes leverages GPU compositing layers, preventing costly layout reflows.

---

## 4. Senior Developer Checklist for Production Releases

1. **Zero Console Errors / Warnings**: Verify no unhandled React key warnings or SSR hydration mismatches occur.
2. **Type Safety**: Ensure strict TypeScript interfaces for component props and metadata exports.
3. **Responsive Fluidity**: Test layouts on mobile screens (375px), tablets (768px), and ultra-wide desktops (1440px+).
4. **Clean Git State**: Maintain readable commit histories and clean repository structures before pushing to GitHub.
