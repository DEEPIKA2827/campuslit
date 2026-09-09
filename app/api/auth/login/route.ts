/**
 * @file app/api/auth/login/route.ts
 * @description Next.js 16 Route Handler for User Authentication / Login.
 * @purpose Authenticates user credentials via UserService, issues a signed session token, and sets the HTTP-only cookie.
 */

import { NextRequest } from "next/server";
import { userService } from "@/services/user.service";
import { createSessionToken, setAuthCookie } from "@/lib/auth";
import { ResponseBuilder } from "@/utils/api-response";
import { Logger } from "@/lib/logger";

/**
 * POST /api/auth/login
 * Public authentication endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return ResponseBuilder.error("Validation Error: Request body must be a valid JSON object.", 400, "VALIDATION_ERROR");
    }

    Logger.info("POST /api/auth/login requested", { email: body?.email });

    // Delegate to UserService (handles validation, credential check with constant-time verification)
    const result = await userService.login(body);

    // Issue signed session token
    const token = createSessionToken(result.user.userId, result.user.role);

    // Build 200 Success Response with HTTP-only session cookie
    const response = ResponseBuilder.success(
      result,
      "Login successful",
      200
    );
    setAuthCookie(response, token);

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    Logger.error("POST /api/auth/login failed", error);

    if (message.startsWith("Authentication Error") || message.includes("Invalid email or password")) {
      return ResponseBuilder.error("Invalid email or password.", 401, "UNAUTHORIZED");
    }
    if (message.startsWith("Validation Error")) {
      return ResponseBuilder.error(message, 400, "VALIDATION_ERROR");
    }

    return ResponseBuilder.error("An unexpected error occurred during authentication.", 500, "INTERNAL_ERROR");
  }
}
