/**
 * @file app/api/auth/register/route.ts
 * @description Next.js 16 Route Handler for Student & User Registration.
 * @purpose Registers a new user account, initializes defaults, creates a session token, and sets the HTTP-only cookie.
 */

import { NextRequest } from "next/server";
import { userService } from "@/services/user.service";
import { createSessionToken, setAuthCookie } from "@/lib/auth";
import { ResponseBuilder } from "@/utils/api-response";
import { Logger } from "@/lib/logger";

/**
 * POST /api/auth/register
 * Public registration endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return ResponseBuilder.error("Validation Error: Request body must be a valid JSON object.", 400, "VALIDATION_ERROR");
    }

    Logger.info("POST /api/auth/register requested", { email: body?.email });

    // Delegate to UserService (handles validation, password hashing, and user/profile initialization)
    const result = await userService.register(body, body?.profile);

    // Issue signed session token
    const token = createSessionToken(result.user.userId, result.user.role);

    // Build 201 Created Response with HTTP-only session cookie
    const response = ResponseBuilder.success(
      result,
      "User registered successfully",
      201
    );
    setAuthCookie(response, token);

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Registration failed";
    Logger.error("POST /api/auth/register failed", error);

    if (message.startsWith("Conflict Error") || message.includes("already registered")) {
      return ResponseBuilder.error(message, 409, "CONFLICT");
    }
    if (message.startsWith("Validation Error")) {
      return ResponseBuilder.error(message, 400, "VALIDATION_ERROR");
    }

    return ResponseBuilder.error("An unexpected error occurred during registration.", 500, "INTERNAL_ERROR");
  }
}
