/**
 * @file lib/auth-guard.ts
 * @description Reusable Backend Authorization Guard for Next.js Route Handlers.
 * @purpose Enforces authentication and Role-Based Access Control (RBAC) uniformly across endpoints.
 * @security
 * - Missing token -> HTTP 401 Unauthorized
 * - Invalid or Expired token -> HTTP 401 Unauthorized
 * - Valid token but insufficient role -> HTTP 403 Forbidden
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, AuthSession } from "@/lib/auth";
import { UserRole } from "@/types/api.types";
import { ResponseBuilder } from "@/utils/api-response";
import { Logger } from "@/lib/logger";

export type AuthResult = 
  | { success: true; session: AuthSession }
  | { success: false; response: NextResponse };

/**
 * Requires the incoming request to be authenticated with a valid, non-expired JWT session.
 * Returns either the verified AuthSession or an immediate HTTP 401 NextResponse.
 */
export function requireAuth(request: NextRequest): AuthResult {
  const session = getAuthenticatedUser(request);
  if (!session) {
    Logger.debug("requireAuth: Unauthorized access attempt", { path: request.nextUrl.pathname });
    return {
      success: false,
      response: ResponseBuilder.error("Unauthorized: Authentication required.", 401, "UNAUTHORIZED"),
    };
  }

  return { success: true, session };
}

/**
 * Requires the incoming request to be authenticated AND hold one of the permitted roles.
 * Returns either the verified AuthSession or an immediate HTTP 401 / 403 NextResponse.
 */
export function requireRole(
  request: NextRequest,
  allowedRoles: UserRole | UserRole[]
): AuthResult {
  const auth = requireAuth(request);
  if (!auth.success) {
    return auth;
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!roles.includes(auth.session.role)) {
    Logger.warn("requireRole: Forbidden access attempt", {
      userId: auth.session.userId,
      userRole: auth.session.role,
      requiredRoles: roles,
      path: request.nextUrl.pathname,
    });
    return {
      success: false,
      response: ResponseBuilder.error(
        "Forbidden: You do not have permission to access this resource.",
        403,
        "FORBIDDEN"
      ),
    };
  }

  return auth;
}
