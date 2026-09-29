# CampusLit AI Mentor — Architecture & Reliability Specification

## 1. System Architecture Overview

The CampusLit AI Mentor is an AI Senior Engineering Mentor designed to guide engineering students through curriculum challenges, viva preparation, study plans, placement preparation, and verified academic resource discovery. It maintains strict data isolation and authoritative data boundaries.

```
                                  STUDENT CLIENT
                              (Next.js React UI)
                                       │
                                       ▼ HTTP POST (JSON / Event-Stream)
                        /api/chat/message (Route Handler)
                                       │
                   ┌───────────────────┴───────────────────┐
                   │ Authenticated Session Guard (HMAC)    │
                   │ Rate Limiter (Bounded AI Quota)       │
                   │ Input & Multi-Attachment Sanitizer    │
                   │   (PDF, DOCX, PPTX, PNG, JPG, WEBP)   │
                   └───────────────────┬───────────────────┘
                                       │
                                       ▼
                                 MentorService
                   ┌───────────────────┴───────────────────┐
                   │ 1. Request Intent Classifier (6 Modes)│
                   │ 2. Selective Context Assembly:        │
                   │    - Minimal Profile (General Q&A)    │
                   │    - Authoritative State (Personal)   │ ◄── Domain Services (Attendance, Roadmap)
                   │ 3. Office & Multi-Doc Preprocessor    │ ◄── Zero-Dep OpenXML Extractor (zlib)
                   │ 4. Ambiguity Clarification Engine     │
                   │ 5. Verified Knowledge & RAG           │ ◄── RagService (Catalog Links Only)
                   │ 6. Specialized Prompt Synthesis       │
                   └───────────────────┬───────────────────┘
                                       │
                                       ▼
                              LLM Provider Layer
                   ┌───────────────────┴───────────────────┐
                   │ ILLMProvider Interface                │
                   │ ├── GeminiProviderAdapter [CURRENT]   │
                   │ │   - Online / Cloud Inference        │
                   │ │   - Bounded Retries & Backoff       │
                   │ │   - 35-45s Timeout Bounds           │
                   │ │   - SSE Progressive Streaming       │
                   │ └── OllamaProviderAdapter [FUTURE]    │
                   │     - Local / Offline Inference       │
                   │     - Zero Internet Required          │
                   └───────────────────┬───────────────────┘
                                       │
                                       ▼ Upstream API
                            Google Gemini Flash 2.5
                                       │
                                       ▼ SSE Token Stream / Normalized Response
                                 MentorService
                                       │
                                       ▼ chatRepository
                       PostgreSQL (chat_threads & chat_messages)
                                       │
                                       ▼
                            HTTP 200 / SSE Event Stream
                               (Rendered in UI)
```

---

## 2. LLM Provider Layer & Future Offline Architecture (Ollama)

### Clean Provider Abstraction (`ILLMProvider`)

CampusLit decouples all business mentoring logic from the concrete inference engine via the `ILLMProvider` interface in `services/llm-provider.service.ts`:

```typescript
export interface ILLMProvider {
  name: string;
  generateText(messages: LLMMessage[], options?: LLMGenerateOptions): Promise<string>;
  generateStream?(messages: LLMMessage[], options?: LLMGenerateOptions): AsyncIterable<string>;
}
```

### Current Production Provider: Google Gemini (`GeminiProviderAdapter`)
- **Execution Model**: Cloud/Online inference via Google Generative AI API (`gemini-2.5-flash`).
- **Network Dependency**: **Requires active internet connectivity** to reach Google's API servers.
- **Capabilities**: Full multimodal comprehension (PDF pages, high-res code screenshots, circuit diagrams), high context window, ultra-fast TTFT with thinking budget set to 0.
- **Honest System Status**: The application truthfully communicates that the current AI Senior Mentor requires internet access to reach Gemini. No false "offline mode" is simulated.

### Future Provider Boundary: Local Ollama (`OllamaProviderAdapter`)
CampusLit is designed so that local, privacy-first, offline inference can be introduced seamlessly in the future without modifying `MentorService`, database schemas, or chat UI components:

```
[FUTURE OFFLINE PIPELINE]
CampusLit Client
    └── /api/chat/message
          └── MentorService
                └── OllamaProviderAdapter (implements ILLMProvider)
                      └── Local HTTP Client: http://localhost:11434/api/generate
                            └── Local Ollama Server (Background Daemon)
                                  └── Local Model (e.g., Llama 3 8B / Mistral 7B)
```

#### Key Architecture Principles for Future Offline Support:
1. **Zero Architecture Rewrite**: To enable Ollama in the future, developers only need to instantiate `OllamaProviderAdapter` implementing `ILLMProvider` and register it in `services/llm-provider.service.ts`.
2. **Current Scope Boundary**: **Ollama is NOT implemented in this phase.** No local models are downloaded, no Ollama dependencies are installed, and no mock offline behaviors are created.
3. **Explicit Distinction**:
   - **CURRENT**: Gemini = cloud/online inference.
   - **FUTURE**: Ollama = possible local/offline inference.

---

## 3. 6-Mode Intent Routing & Selective Context Gathering

To eliminate unnecessary database overhead, reduce prompt size by up to 80%, and slash response latency, requests are classified into 6 distinct operational modes:

| Mode | Trigger / Condition | Context Retrieved | System Prompt & Behavior Contract |
|---|---|---|---|
| **A. GENERAL_KNOWLEDGE** | Free-form technical questions (*"What is a binary tree?"*, *"Explain normalization"*, *"What is TCP?"*, *"Explain pointers"*) | Minimal student context (Semester, Specialization, Programming Level) | Fast direct response. **No queries to attendance, CIE, Action Radar, roadmap, or RAG**. Standard 5-part structure (Answer, Explanation, Example, Key Points, Practice). |
| **B. DOCUMENT_GROUNDED** | Uploaded document with Q&A query (*"Answer only from this PDF"*, *"Summarize this doc"*, *"Explain question 4"*) | Uploaded document text / multimodal inlineData | **Exclusive Source of Truth**. Strict missing-fact refusal: *"I couldn't find that information in the uploaded document."* Zero hallucination. |
| **C. DOCUMENT_COMPARISON** | Multiple uploaded documents with comparison intent (*"Compare these"*, *"What's different?"*) | Both documents parsed and labeled as Source A and Source B | Structured comparison table (`\| Aspect \| Document A \| Document B \|`) followed by granular differences in topics, modules, requirements, and dates. |
| **D. RESOURCE_RETRIEVAL** | Material/link inquiries (*"Give me DSA resources"*, *"Best DBMS resources"*, *"Where can I learn OS?"*) | Verified catalog items matching query scope | **Verified URLs Only**. Never invent URLs or YouTube links. Format: Name, Provider, Topic, Purpose, URL. Fallback: *"I couldn't find a verified CampusLit resource for that request."* |
| **E. MULTIMODAL** | Image attachment (code screenshot, circuit diagram, math problem, syllabus photo) | Image base64 encoded as Gemini `inlineData` | Visual inspection and technical analysis. Truthful error if parsing fails. |
| **F. PERSONALIZED_CAMPUSLIT** / **MIXED** | Student-specific questions (*"What should I study this week?"*, *"Am I academically at risk?"*, *"My attendance"*, *"How to prepare for placements?"*) | Full authoritative student state: Profile, Course, Roadmap, Action Radar, Attendance (via `AttendanceService`), CIE marks | Authoritative domain data is canonical. Gemini explains the data; it **never invents or overwrites** attendance, marks, or mission goals. Study plan structure: Priority, Reason, Timeline, Action items. |

---

## 4. Ambiguity Clarification Engine

Inspired by ambiguity detection in enterprise systems, the AI Senior Mentor identifies underspecified student queries where a direct assumption would degrade mentoring quality:

- **Trigger Condition**: Queries that are inherently multi-directional where the student's primary objective materially affects the recommended path (e.g., *"Give me the best DSA resource"*, *"Which language is best?"*, *"How should I prepare?"*).
- **Mentor Behavior**: Asks a concise clarification question with 3–4 concrete, actionable choices before prescribing a specific resource or curriculum:
  ```markdown
  Best for which goal?
  1. Placement/interviews
  2. VTU exams
  3. Competitive programming
  4. Beginner fundamentals
  ```
- **Frictionless Fast-Path**: Clear, unambiguous technical questions (e.g., *"What is normalization?"*, *"What is a stack?"*, *"Explain deadlock"*) are answered immediately with zero clarification questions.

---

## 5. Document & Office Processing Engine

CampusLit supports student-relevant academic files reliably without heavy native binaries:

| File Format | Processing Pipeline | Output & Feature Support |
|---|---|---|
| **PDF** | Multimodal inlineData | Native page-by-page vision and textual comprehension. |
| **DOCX** | `lib/docx-extractor.ts` (Node `zlib.inflateRawSync`) | Zero-dependency OpenXML extraction of `word/document.xml`. Preserves paragraph structure and headings. |
| **PPTX** | `lib/docx-extractor.ts` (Node `zlib.inflateRawSync`) | Zero-dependency OpenXML extraction of `ppt/slides/slide{N}.xml`. Preserves slide references (`[Slide 1]`, `[Slide 2]`). |
| **PNG / JPG / WEBP** | Multimodal inlineData | High-resolution image inspection for code screenshots, diagrams, and math formulas. |
| **Unsupported Formats** | Server-side MIME/extension whitelist | Friendly refusal: *"This file type isn't supported yet. Please attach a PDF, DOCX, PPTX, PNG, JPG/JPEG, or WEBP file."* |

---

## 6. Real-Time Streaming & Progressive Rendering

To provide immediate feedback and reduce perceived latency:

1. **Server-Sent Events (SSE)**: `POST /api/chat/message` detects `stream: true` or `Accept: text/event-stream` and establishes an SSE stream (`ReadableStream`).
2. **Progressive Token Delivery**: Tokens generated by `mentorService.generateMentorStream` are pushed in real time (`data: {"type":"token","token":"..."}`).
3. **Database Persistence**: Upon stream completion, the full assembled assistant message is persisted to PostgreSQL (`chatRepository.appendMessage`) before emitting the `{"type":"done"}` event.
4. **Client-Side Progressive Rendering**: The frontend updates the assistant message bubble progressively as chunks arrive, giving students an instantaneous reading experience.

---

## 7. Security & Credential Isolation

1. **Compromised Key Revocation**: Any previously exposed developer API credentials must be revoked manually in Google AI Studio console.
2. **Secure Key Storage**: The active Gemini API key is stored exclusively in `.env.local` on the server.
3. **Git Protection**: Verified that `.gitignore` contains `.env*`, `.env.local`, and `*.log`. Repository history contains zero secret leaks.
4. **Bundle Secrecy**: All LLM provider invocations execute strictly server-side in Node.js Route Handlers. The client bundle contains zero references to `process.env.GEMINI_API_KEY`.
5. **Cross-User Data Isolation**: Every chat thread and message operation strictly verifies `userId` from the cryptographically verified HMAC session. Cross-user access is impossible.
6. **Prompt Injection Defense**: Uploaded documents and student messages are treated purely as untrusted data. Instructions such as *"SYSTEM OVERRIDE"* or *"Ignore previous instructions"* are neutralized.

---

## 8. Resilience & Bounded Failure Handling

- **HTTP 429 (Rate Limit)**: Bounded exponential backoff (1.5s, 3.0s, max 2 retries). User receives polite notification if quota is exhausted: *"The AI service is temporarily busy due to high demand. Please retry in a few seconds."*
- **HTTP 503 (Service Unavailable)**: Bounded retry with exponential backoff.
- **Gateway Timeout (35–45s)**: Aborted cleanly via `AbortSignal`. Returns friendly message preserving user draft.
- **No Stack Traces**: Raw exceptions, internal database URLs, and API keys are never exposed in error responses.
