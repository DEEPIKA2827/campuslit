/**
 * @file middleware.ts
 * @description Next.js 16 Middleware for HTTP request interception.
 * @purpose Handles CORS headers, request logging, rate limiting, and standard security headers.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimiter, RATE_LIMIT_TIERS, RateLimitTier } from "@/lib/rate-limiter";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Intercept API routes only
  if (pathname.startsWith("/api/")) {
    // 1. Handle Preflight OPTIONS Request
    if (request.method === "OPTIONS") {
      const headers = new Headers({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Test-Identifier",
        "Access-Control-Max-Age": "86400",
      });
      return new NextResponse(null, { status: 200, headers });
    }

    // 2. Identify Client for Rate Limiting
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const testIdentifier =
      process.env.NODE_ENV === "production" ? null : request.headers.get("x-test-identifier");
    const rateLimitKey = testIdentifier ? `test_${testIdentifier}` : `${clientIp}_${pathname.split("/")[2] || "root"}`;

    // 3. Determine Rate Limit Tier
    let tier: RateLimitTier = RATE_LIMIT_TIERS.READ;
    if (pathname.startsWith("/api/auth/")) {
      tier = RATE_LIMIT_TIERS.AUTH;
    } else if (["POST", "PATCH", "DELETE", "PUT"].includes(request.method)) {
      tier = RATE_LIMIT_TIERS.MUTATION;
    }

    const limitResult = rateLimiter.check(rateLimitKey, tier);

    // 4. Enforce 429 Too Many Requests on Rate Limit Exceeded
    if (!limitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many requests. Please slow down and try again.",
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            retryAfter: limitResult.retryAfter,
            timestamp: new Date().toISOString(),
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(limitResult.retryAfter),
            "X-RateLimit-Limit": String(limitResult.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(limitResult.resetSeconds),
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // 5. Proceed with Rate Limit Headers Attached
    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Test-Identifier");
    response.headers.set("X-RateLimit-Limit", String(limitResult.limit));
    response.headers.set("X-RateLimit-Remaining", String(limitResult.remaining));
    response.headers.set("X-RateLimit-Reset", String(limitResult.resetSeconds));

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};

