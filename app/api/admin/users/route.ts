/**
 * @file app/api/admin/users/route.ts
 * @description Admin-only Route Handler demonstrating Role-Based Access Control (RBAC).
 * @purpose Returns safe, sanitized user identities for administrators.
 * @security
 * - Requires active JWT authentication (HTTP 401 if missing/invalid/expired)
 * - Requires "admin" role (HTTP 403 Forbidden for "student" or unauthorized roles)
 * - Never returns password hashes or credentials
 */

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { userRepository } from "@/repositories/user.repository";
import { ResponseBuilder } from "@/utils/api-response";
import { Logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  // 1. Enforce RBAC security boundary: Strictly require "admin" role
  const auth = requireRole(request, "admin");
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(1, Number(searchParams.get("limit") || 50)), 100);
    const offset = Math.max(0, Number(searchParams.get("offset") || 0));

    Logger.info("GET /api/admin/users accessed by admin", {
      adminUserId: auth.session.userId,
      limit,
      offset,
    });

    // 2. Retrieve sanitized user list (passwordHash is completely excluded from query)
    const users = await userRepository.listAllUsers(limit, offset);

    return ResponseBuilder.success(
      {
        users,
        pagination: { limit, offset, count: users.length },
      },
      "Admin users list retrieved successfully."
    );
  } catch (error: unknown) {
    Logger.error("GET /api/admin/users failed", error);
    return ResponseBuilder.error(
      "Internal Server Error: Failed to retrieve user directory.",
      500,
      "INTERNAL_ERROR"
    );
  }
}
