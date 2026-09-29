/**
 * @file lib/auth.ts
 * @description Authentication and Session Token Management Facade.
 * @purpose Cryptographic HMAC-SHA256 session token signer/verifier, legacy cookie manager,
 * and unified session resolver bridging Clerk external identities to CampusLit internal identities.
 * @security
 * - Uses Node.js crypto primitives with constant-time signature comparison.
 * - Supports multi-key secret rotation via AUTH_SESSION_SECRETS (Phase 5F).
 * - Bridges Clerk identity to internal users.userId (Phase 6A.2.2a) without circular dependencies.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { UserRole } from "@/types/api.types";
import { Logger } from "@/lib/logger";

// Shared dependency-neutral authentication types and constants
import {
  AuthSession,
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE,
  VALID_ROLES,
  CLERK_SESSION_COOKIE_NAME,
  ClerkIdentity,
  ResolveAuthOptions,
} from "./auth-types";

// Re-export shared contracts for seamless downstream compatibility
export {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE,
  CLERK_SESSION_COOKIE_NAME,
  VALID_ROLES,
};
export type { AuthSession, ClerkIdentity, ResolveAuthOptions };

// Clerk Identity Adapter resolution functions
import {
  resolveInternalUserByClerkId,
  extractClerkIdentity,
} from "./auth-adapter";

export { resolveInternalUserByClerkId, extractClerkIdentity };

/**
 * Retrieves the cryptographic secret(s) from the environment.
 * Supports comma-separated secret list (AUTH_SESSION_SECRETS) for zero-downtime secret rotation,
 * falling back to single AUTH_SESSION_SECRET.
 * (Phase 5F Production Hardening - Preserved)
 */
export function getSessionSecrets(): string[] {
  const multiSecrets = process.env.AUTH_SESSION_SECRETS;
  if (multiSecrets && multiSecrets.trim().length > 0) {
    const parsed = multiSecrets
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (parsed.length > 0) {
      return parsed;
    }
  }

  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error(
      "Configuration Error: AUTH_SESSION_SECRET or AUTH_SESSION_SECRETS environment variable is missing or empty. Please set AUTH_SESSION_SECRET in your environment configuration."
    );
  }
  return [secret.trim()];
}

/**
 * Standard RFC 7519 JWT Header for HMAC-SHA256
 */
const JWT_HEADER = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" }), "utf8").toString("base64url");

/**
 * Creates a cryptographically signed standard RFC 7519 JWT token (HS256).
 * Token structure: <base64url-header>.<base64url-payload>.<base64url-signature>
 * Always signs with the primary (active) secret (index 0).
 */
export function createSessionToken(
  userId: number,
  role: UserRole,
  expiresInSeconds = AUTH_COOKIE_MAX_AGE
): string {
  if (!userId || typeof userId !== "number" || userId <= 0) {
    throw new Error("Authentication Error: userId must be a positive integer.");
  }
  if (!role || !VALID_ROLES.includes(role)) {
    throw new Error(`Authentication Error: Invalid user role: ${role}`);
  }

  const now = Math.floor(Date.now() / 1000);
  const payload: AuthSession = {
    userId,
    role,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const secrets = getSessionSecrets();
  const primarySecret = secrets[0];
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signingInput = `${JWT_HEADER}.${encodedPayload}`;
  const signature = crypto
    .createHmac("sha256", primarySecret)
    .update(signingInput)
    .digest("base64url");

  return `${signingInput}.${signature}`;
}

/**
 * Verifies a signed JWT (or legacy 2-part token).
 * Validates HMAC-SHA256 signature against primary secret, with graceful fallback across all configured rotation secrets.
 * Uses constant-time signature comparison to prevent timing attacks, validates expiration, and enforces payload schema.
 */
export function verifySessionToken(token: string | null | undefined): AuthSession | null {
  if (!token || typeof token !== "string") {
    return null;
  }

  const trimmedToken = token.trim();
  const parts = trimmedToken.split(".");
  
  // Support both standard RFC 7519 JWT (3 parts: header.payload.signature)
  // and legacy HMAC tokens (2 parts: payload.signature)
  if (parts.length !== 2 && parts.length !== 3) {
    return null;
  }

  const isJwt = parts.length === 3;
  const encodedPayload = isJwt ? parts[1] : parts[0];
  const providedSignature = isJwt ? parts[2] : parts[1];
  const signingInput = isJwt ? `${parts[0]}.${parts[1]}` : parts[0];

  if (!encodedPayload || !providedSignature) {
    return null;
  }

  try {
    const secrets = getSessionSecrets();
    const providedBuffer = Buffer.from(providedSignature);

    let signatureMatches = false;

    // Iterate through all configured secrets (primary + fallback rotation keys)
    for (const secret of secrets) {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(signingInput)
        .digest("base64url");

      const expectedBuffer = Buffer.from(expectedSignature);

      if (
        providedBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(providedBuffer, expectedBuffer)
      ) {
        signatureMatches = true;
        break;
      }
    }

    if (!signatureMatches) {
      return null;
    }

    // Decode and validate payload JSON
    const decodedJson = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const payload = JSON.parse(decodedJson) as Partial<AuthSession>;

    if (
      !payload ||
      typeof payload.userId !== "number" ||
      payload.userId <= 0 ||
      typeof payload.role !== "string" ||
      !VALID_ROLES.includes(payload.role as UserRole) ||
      typeof payload.iat !== "number" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (now > payload.exp) {
      Logger.debug("Session token has expired", { userId: payload.userId, exp: payload.exp, now });
      return null;
    }

    return {
      userId: payload.userId,
      role: payload.role as UserRole,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch (error) {
    Logger.debug("verifySessionToken failed", { error: String(error) });
    return null;
  }
}

/**
 * Extracts and verifies authenticated user identity from NextRequest via legacy HMAC token.
 * Checks HTTP-only cookie first, then Authorization Bearer header.
 * Returns verified AuthSession or null if unauthenticated.
 */
export function getAuthenticatedUser(request: NextRequest): AuthSession | null {
  // 1. Check HTTP-only auth_session cookie
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (cookieToken) {
    const session = verifySessionToken(cookieToken);
    if (session) {
      return session;
    }
  }

  // 2. Check Authorization Bearer header (for API/integration testing)
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const bearerToken = authHeader.substring(7).trim();
    const session = verifySessionToken(bearerToken);
    if (session) {
      return session;
    }
  }

  return null;
}

/**
 * Attaches the auth_session HTTP-only cookie to an outgoing NextResponse.
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  });
}

/**
 * Clears the auth_session HTTP-only cookie on an outgoing NextResponse.
 */
export function clearAuthCookie(response: NextResponse): void {
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: 0,
  });
}

/**
 * Resolves the authenticated session for an incoming request.
 *
 * Precedence Order:
 * 1. Checks for authenticated Clerk identity via extractClerkIdentity().
 *    If present, resolves against users.clerk_id via resolveInternalUserByClerkId():
 *    - If mapped: returns AuthSession { userId: internalUserId, role }.
 *    - If unmapped: FAILS CLOSED (returns null). Does NOT fall back to legacy credentials.
 * 2. If no Clerk identity is present, falls back to legacy HMAC-SHA256 session verification
 *    (getAuthenticatedUser) to ensure 100% backward compatibility during migration.
 *
 * Security Invariant:
 * Downstream route handlers and services ALWAYS receive session.userId: number.
 */
export async function resolveAuthSession(
  request: NextRequest,
  options?: ResolveAuthOptions
): Promise<AuthSession | null> {
  // 1. Attempt Clerk resolution
  const clerkIdentity = await extractClerkIdentity(request, options);

  if (clerkIdentity && clerkIdentity.clerkUserId) {
    const internalSession = await resolveInternalUserByClerkId(
      clerkIdentity.clerkUserId,
      options?.dbClient
    );

    if (internalSession) {
      return internalSession;
    }

    // Rule 9: Clerk authentication succeeded but no internal users row was found.
    // Fail closed. Do NOT silently create a user; do NOT fall back.
    Logger.warn("resolveAuthSession: Authenticated Clerk user has no internal record", {
      clerkUserId: clerkIdentity.clerkUserId,
    });
    return null;
  }

  // 2. Fall back to legacy HMAC session verification
  return getAuthenticatedUser(request);
}
