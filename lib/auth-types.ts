/**
 * @file lib/auth-types.ts
 * @description Dependency-neutral shared authentication contracts, types, and constants.
 * @purpose Decouples authentication contracts to eliminate circular dependencies between
 * legacy HMAC auth (lib/auth.ts) and external identity adapters (lib/auth-adapter.ts).
 */

import { UserRole } from "@/types/api.types";

/**
 * Standard HTTP-only cookie name for legacy HMAC session tokens.
 */
export const AUTH_COOKIE_NAME = "auth_session";

/**
 * Standard max age for legacy HMAC session tokens (7 days in seconds).
 */
export const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

/**
 * Standard cookie name for Clerk client session tokens.
 */
export const CLERK_SESSION_COOKIE_NAME = "__session";

/**
 * Canonical valid roles recognized across CampusLit.
 */
export const VALID_ROLES: readonly UserRole[] = ["student", "admin", "faculty"] as const;

/**
 * Canonical internal application session representation.
 * Downstream domain services, repositories, and route handlers receive strictly this contract.
 */
export interface AuthSession {
  /**
   * Internal PostgreSQL users.user_id (BIGINT PK / number).
   * Invariant: Must always be a positive integer surrogate key.
   */
  userId: number;
  /**
   * Verified user role.
   */
  role: UserRole;
  /**
   * Session issuance timestamp (seconds since Unix epoch).
   */
  iat: number;
  /**
   * Session expiration timestamp (seconds since Unix epoch).
   */
  exp: number;
}

/**
 * Verified external identity extracted server-side from Clerk.
 */
export interface ClerkIdentity {
  /**
   * External Clerk user ID (e.g. "user_2N9x...").
   */
  clerkUserId: string;
  /**
   * Optional Clerk session ID.
   */
  sessionId?: string;
}

/**
 * Configuration options for identity resolution and testing.
 */
export interface ResolveAuthOptions {
  /**
   * Optional Clerk secret key override for token verification.
   */
  clerkSecretKey?: string;
  /**
   * Optional mock or custom token verifier for testing/isolated environments.
   */
  tokenVerifier?: (token: string) => Promise<{ sub: string; sid?: string } | null>;
  /**
   * Optional direct mock Clerk identity (used strictly for isolated unit test harnesses).
   */
  mockClerkIdentity?: ClerkIdentity | null;
  /**
   * Optional database client override (for testing or transaction scoping).
   */
  dbClient?: any;
}
