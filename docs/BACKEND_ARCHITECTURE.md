# CampusLit Backend Architecture & Foundation Specification

## 1. Executive Summary & Stack Alignment

This document details the production backend architecture for **CampusLit**, built inside the **Next.js 16 App Router** ecosystem using **TypeScript**.

### Industry Standard Backend Stack:
* **Framework**: Next.js 16 App Router (Node.js / Edge Runtime Route Handlers)
* **Language**: TypeScript
* **Database**: PostgreSQL (Hosted on Supabase or Neon)
* **ORM / Query Builder**: ORM (selection pending — Drizzle/Prisma)
* **Authentication**: Clerk or Supabase Auth
* **Deployment**: Vercel

---

## 2. Request Flow Architecture

When a client sends an HTTP request to the CampusLit API, it traverses a strict 4-layer architecture:

```
[ Frontend Client (React) ]
           │
           │ HTTP Request (GET / POST / PATCH / DELETE)
           ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Middleware Layer (middleware.ts)                         │
│    - Intercepts requests                                   │
│    - Configures CORS headers                                │
│    - Extracts Auth JWT tokens                              │
└─────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Route Handler Layer (app/api/*/route.ts)                  │
│    - Parses URL parameters & JSON payloads                   │
│    - Delegates execution to Service Layer                    │
│    - Formats output using ResponseBuilder utility           │
└─────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Service Layer (services/*.service.ts)                    │
│    - Enforces business validation rules                     │
│    - Calculates academic logic (e.g. 75% Bunk Defense)       │
│    - Orchestrates data operations                            │
└─────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Repository Layer / DAL (repositories/*.repository.ts)    │
│    - Encapsulates database queries                           │
│    - Interacts with Prisma ORM / PostgreSQL                 │
│    - Returns domain DTO objects                              │
└─────────────────────────────────────────────────────────────┘
           │
           ▼
  [ PostgreSQL Database ]
```

---

## 3. Folder Responsibilities Matrix

| Directory | Primary Responsibility | Example Files |
| :--- | :--- | :--- |
| **`app/api/`** | HTTP Endpoints & Web Route Handlers | `app/api/profile/route.ts`, `app/api/roadmaps/route.ts` |
| **`config/`** | Global application constants & settings | `config/app.config.ts` |
| **`lib/`** | Infrastructure singletons & core clients | `lib/db.ts`, `lib/logger.ts`, `lib/env.ts` |
| **`middleware.ts`** | Request interception, CORS & security | `middleware.ts` |
| **`repositories/`** | Data Access Layer (DAL) for DB queries | `repositories/profile.repository.ts` |
| **`services/`** | Business Logic Layer (BLL) & orchestration | `services/profile.service.ts` |
| **`types/`** | Shared DTO interfaces & response wrappers | `types/api.types.ts` |
| **`utils/`** | Standardized helper utilities | `utils/api-response.ts` |
| **`validations/`** | Input validation schemas & validators | `validations/profile.validation.ts` |

---

## 4. API Lifecycle

1. **Request Interception**: `middleware.ts` matches incoming `/api/*` routes, injects CORS headers, and verifies authorization headers.
2. **Route Entry**: Next.js route handler (`app/api/profile/route.ts`) handles request method (`GET`, `POST`).
3. **Validation**: Input payload is checked against validation rules in `validations/`.
4. **Service Processing**: Route Handler passes clean input to `ProfileService.setupStudentProfile()`.
5. **Data Persistence**: `ProfileService` calls `ProfileRepository.createProfile()`, which performs database operations.
6. **Response Serialization**: Output is formatted using `ResponseBuilder.success()` or `ResponseBuilder.error()` and returned as standardized JSON (`ApiResponse<T>`).

---

## 5. Service & Repository Layer Standards

* **Service Layer (`services/`)**: Must contain **zero HTTP/Web concepts** (no `NextRequest`, no `NextResponse`, no status codes). It handles business calculations, error throws, and data transformations.
* **Repository Layer (`repositories/`)**: Must contain **zero business logic**. It strictly executes queries (`findMany`, `create`, `update`) against the database.

---

## 6. Future Integration Roadmaps

### A. Future Database Integration
1. Install chosen ORM and configure database connection.
2. Define schema for Student Profiles, Roadmaps, and Settings.
3. Update `lib/db.ts` to export the initialized client.
4. Implement SQL queries inside `repositories/*.repository.ts` methods.

### B. Future Authentication Integration (Clerk / Supabase Auth)
1. Wrap root layout with `<ClerkProvider>`.
2. Update `middleware.ts` with auth middleware to protect `/api/profile`, `/api/attendance`, and `/api/chat`.
3. Extract `auth().userId` inside route handlers and pass to Service Layer.
