/**
 * @file lib/auth-adapter.ts
 * @description Phase 6A.2.2a Clerk Identity Adapter and Internal User Resolution Engine.
 * @purpose Bridges authenticated Clerk external identities to internal CampusOS surrogate user records.
 * @architecture
 * Dependency direction: lib/auth-adapter.ts depends strictly on lib/auth-types.ts, db, logger, and Clerk SDK.
 * It NEVER imports from lib/auth.ts, preventing any circular dependencies.
 * @security
 * - Strictly enforces internal numeric users.userId invariant.
 * - Never trusts client-supplied headers or query params for identity.
 * - Never maps Clerk user ID directly into userId.
 * - Fails closed if Clerk identity is unmapped.
 * - Preserves existing AuthSession contract { userId: number, role: UserRole, iat, exp }.
 */

import { NextRequest } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { Logger } from "@/lib/logger";
import { UserRole } from "@/types/api.types";
import {
  AuthSession,
  ClerkIdentity,
  ResolveAuthOptions,
  CLERK_SESSION_COOKIE_NAME,
  VALID_ROLES,
  AUTH_COOKIE_MAX_AGE,
} from "@/lib/auth-types";

export { CLERK_SESSION_COOKIE_NAME };
export type { ClerkIdentity, ResolveAuthOptions };

/**
 * Resolves an authenticated Clerk user ID to an internal CampusOS AuthSession.
 *
 * Identity Resolution Pipeline:
 * 1. Validates clerkUserId format.
 * 2. Queries PostgreSQL: SELECT user_id, role, clerk_id FROM users WHERE clerk_id = :clerkUserId.
 * 3. Fails closed (returns null) if no matching user record is found.
 * 4. Asserts that the resolved user_id is a positive integer (surrogate key invariant).
 * 5. Validates that the user role is one of ('student', 'admin', 'faculty').
 * 6. Returns canonical AuthSession { userId: number, role: UserRole, iat: number, exp: number }.
 */
export async function resolveInternalUserByClerkId(
  clerkUserId: string,
  dbClient: typeof db = db
): Promise<AuthSession | null> {
  if (!clerkUserId || typeof clerkUserId !== "string" || clerkUserId.trim().length === 0) {
    Logger.debug("resolveInternalUserByClerkId: Invalid or empty clerkUserId provided");
    return null;
  }

  const trimmedClerkId = clerkUserId.trim();

  if (!dbClient) {
    Logger.error("resolveInternalUserByClerkId: Database client not available");
    return null;
  }

  try {
    const [record] = await dbClient
      .select({
        userId: schema.users.userId,
        role: schema.users.role,
        clerkId: schema.users.clerkId,
      })
      .from(schema.users)
      .where(eq(schema.users.clerkId, trimmedClerkId));

    // Rule 9: Fail closed if no internal user row is found
    if (!record) {
      Logger.warn("resolveInternalUserByClerkId: Unmapped Clerk identity - access denied", {
        clerkUserId: trimmedClerkId,
      });
      return null;
    }

    // Rule 8: Never map Clerk user ID directly into userId; assert positive integer surrogate PK
    if (typeof record.userId !== "number" || record.userId <= 0 || !Number.isInteger(record.userId)) {
      Logger.error("resolveInternalUserByClerkId: Corrupted or non-numeric internal userId", {
        clerkUserId: trimmedClerkId,
        userId: record.userId,
      });
      return null;
    }

    // Rule 4 & 5: Validate role and return internal identity
    if (!VALID_ROLES.includes(record.role as UserRole)) {
      Logger.warn("resolveInternalUserByClerkId: User has invalid or inactive role", {
        userId: record.userId,
        role: record.role,
      });
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    return {
      userId: record.userId, // Strictly internal integer identity
      role: record.role as UserRole,
      iat: now,
      exp: now + AUTH_COOKIE_MAX_AGE,
    };
  } catch (error) {
    Logger.error("resolveInternalUserByClerkId: Database lookup failed", error);
    return null;
  }
}

/**
 * Extracts and verifies the authenticated Clerk identity server-side from an incoming NextRequest.
 *
 * Security Assertions:
 * - Never trusts client-supplied headers (e.g. x-clerk-user-id or x-user-id).
 * - Checks for verified Clerk middleware state or evaluates the signed __session cookie / Bearer JWT.
 * - Uses @clerk/nextjs/server verifyToken or injected verifier.
 */
export async function extractClerkIdentity(
  request: NextRequest,
  options?: ResolveAuthOptions
): Promise<ClerkIdentity | null> {
  // Test/mock injection hook for hermetic unit testing
  if (options?.mockClerkIdentity !== undefined) {
    return options.mockClerkIdentity;
  }

  // 1. Attempt to obtain identity via @clerk/nextjs/server getAuth if middleware is active
  try {
    const { getAuth } = await import("@clerk/nextjs/server");
    const authState = getAuth(request);
    if (authState && authState.userId && typeof authState.userId === "string") {
      return {
        clerkUserId: authState.userId,
        sessionId: authState.sessionId || undefined,
      };
    }
  } catch {
    // getAuth throws if clerkMiddleware is not active in the request chain.
    // Gracefully proceed to standalone token verification.
  }

  // 2. Extract token from Clerk __session cookie or Authorization Bearer header
  const sessionCookie = request.cookies.get(CLERK_SESSION_COOKIE_NAME)?.value;
  let token: string | null = sessionCookie || null;

  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const candidate = authHeader.substring(7).trim();
      // Only treat as Clerk token if it has standard 3-part JWT structure
      if (candidate.split(".").length === 3) {
        token = candidate;
      }
    }
  }

  if (!token) {
    return null;
  }

  // 3. Verify the token cryptographically
  try {
    if (options?.tokenVerifier) {
      const verified = await options.tokenVerifier(token);
      if (verified && verified.sub) {
        return {
          clerkUserId: verified.sub,
          sessionId: verified.sid,
        };
      }
      return null;
    }

    // Default to @clerk/nextjs/server verifyToken
    const secretKey = options?.clerkSecretKey || process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      // Without a secret key or verifier, cannot verify raw Clerk JWT
      return null;
    }

    const { verifyToken } = await import("@clerk/nextjs/server");
    const payload = await verifyToken(token, { secretKey });
    if (payload && payload.sub && typeof payload.sub === "string") {
      return {
        clerkUserId: payload.sub,
        sessionId: typeof payload.sid === "string" ? payload.sid : undefined,
      };
    }

    return null;
  } catch (error) {
    Logger.debug("extractClerkIdentity: Token verification failed", { error: String(error) });
    return null;
  }
}
