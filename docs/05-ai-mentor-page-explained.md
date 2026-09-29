# `app/ai-mentor/page.tsx`

## Purpose of this file

`app/ai-mentor/page.tsx` is the interactive **CampusLit AI Senior Mentor** component located at route `/ai-mentor`.

It serves to:
1. **Provide Context-Aware Academic Guidance**: Deliver instant, senior-vetted advice tailored to VTU and Autonomous college engineering curriculums in Karnataka.
2. **Simulate Lab Viva & PYQ Answers**: Generate step-by-step exam derivations (e.g., Cayley-Hamilton Theorem) and C programming lab viva explanations.
3. **Offer Career & Velocity Roadmaps**: Guide 1st-year engineering students through SDE roadmaps, GitHub profile setups, and proof-of-work project ideas.
4. **Deliver a Modern Chatbot UI Experience**: Feature a 2-column ChatGPT-style layout with chat history, prompt suggestion chips, code block copy handlers, and real-time response simulation.

---

## Execution Flow

```mermaid
graph TD
    A[User Navigates to /ai-mentor] --> B[Next.js SSR Renders Initial Header & Chat Shell]
    B --> C[Client Hydrates with State: messages, activeHistoryId, inputPrompt]
    C --> D[Render Suggested Prompt Chips & Sidebar History]
    D --> E{User Actions}
    E -- Click Prompt Chip / Type Query -- F[Trigger handleSendMessage]
    F --> G[Append User Message & Set isGenerating = true]
    G --> H[Simulate AI Mentor Processing Timeout]
    H --> I[Append Contextual AI Senior Answer with Code Snippet]
    I --> J[Render Copy Button & Senior Vetted Badge]
```

---

## Key Components & Imports

* `"use client"`: Enables interactive state management (`useState`), event handlers (`onKeyDown`, `onClick`), and Clipboard browser APIs.
* `import Link from "next/link"`: Client-side routing between workspace and AI mentor pages.
* `import { MessageSquare, Send, Sparkles, UserCheck, Copy, Check, Terminal, Paperclip, ... } from "lucide-react"`: Vector iconography for message bubbles, prompt chips, and action tools.

---

## State Architecture

| State Variable | Type | Initial Value | Description |
| :--- | :--- | :--- | :--- |
| `messages` | `Array<Message>` | `initialMessages` | Stream of conversation messages between Student and AI Mentor. |
| `inputPrompt` | `string` | `""` | Active text value of the textarea user input. |
| `isGenerating` | `boolean` | `false` | Indicates whether the AI mentor is actively generating a response (triggers loading animation). |
| `copiedIndex` | `number \| null` | `null` | Index of the AI message whose content was copied to clipboard. |
| `activeHistoryId` | `string` | `"h1"` | Currently selected chat session ID from the left sidebar. |

---

## Code & Logic Walkthrough

### 1. Pure Helper Functions Outside Component Scope
To ensure compliance with React purity rules and avoid re-instantiating functions on every render:
```typescript
const getMessageId = () => `m_${Date.now()}`;
const getFormattedTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
```

### 2. Contextual Query Matching (`handleSendMessage`)
The component uses keyword detection to select appropriate senior responses:
* **Lab Viva Qs**: Triggers C programming `malloc()` vs `calloc()` and call-by-reference code blocks when `c programming` or `viva` is present.
* **Velocity Roadmap**: Returns 1st-year milestone breakdown when `roadmap` or `sde` is detected.
* **VTU Exam Derivations**: Generates Cayley-Hamilton 3-step proof when `math` or `cayley` is typed.

### 3. Keyboard Shortcut Handling
Pressing `Enter` without `Shift` triggers form submission, while `Shift + Enter` inserts a newline character:
```typescript
onKeyDown={(e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSendMessage();
  }
}}
```

### 4. Native Clipboard Integration
```typescript
const handleCopy = (text: string, idx: number) => {
  navigator.clipboard.writeText(text);
  setCopiedIndex(idx);
  setTimeout(() => setCopiedIndex(null), 2000);
};
```

---

## Technical Interview Questions & Concepts

### Q1: How do you handle multi-line text input submission without accidental form triggers?
**Answer**: By inspecting `e.key === "Enter"` alongside `!e.shiftKey` in the `onKeyDown` listener. If `Shift` is held, standard line-break insertion occurs; otherwise `e.preventDefault()` stops default behavior and triggers submission.

### Q2: Why extract helper functions (`getMessageId`, `getFormattedTime`) outside the React Component function?
**Answer**: Defining non-reactive utility functions outside component scope prevents them from being re-declared on every state update, reducing garbage collection overhead and satisfying linter purity rules.

### Key Concepts
* **Optimistic UI Updates**: Appending the user message immediately to the state array before API response resolution.
* **Web Clipboard API**: Interacting with `navigator.clipboard.writeText()` safely in client components.
* **Responsive 2-Column Layout**: Collapsing the sidebar on mobile screens (`hidden md:flex`) to prioritize chat stream readability.
