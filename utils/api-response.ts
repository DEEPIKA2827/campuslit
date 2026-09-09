/**
 * @file utils/api-response.ts
 * @description Standardized HTTP response builder utilities for Next.js Route Handlers.
 * @purpose Ensures every API endpoint returns uniform JSON responses with proper status codes and cache controls.
 */

import { NextResponse } from "next/server";
import { ApiResponse, ApiErrorPayload, ApiMetaPayload } from "@/types/api.types";

export class ResponseBuilder {
  /**
   * Return a HTTP 200 OK or 201 Created Success Response
   */
  static success<T>(
    data: T,
    message = "Success",
    statusCode = 200,
    meta?: ApiMetaPayload,
    headers?: Record<string, string>
  ): NextResponse<ApiResponse<T>> {
    const payload: ApiResponse<T> = {
      success: true,
      message,
      data,
      ...(meta && { meta }),
    };
    return NextResponse.json(payload, { status: statusCode, headers });
  }

  /**
   * Return a Cache-Optimized Success Response for master catalogues.
   */
  static cached<T>(
    data: T,
    message = "Success",
    maxAgeSeconds = 3600,
    staleWhileRevalidate = 86400,
    meta?: ApiMetaPayload
  ): NextResponse<ApiResponse<T>> {
    return this.success(data, message, 200, meta, {
      "Cache-Control": `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidate}`,
    });
  }

  /**
   * Return a Private No-Store Response for sensitive student session data.
   */
  static noCache<T>(
    data: T,
    message = "Success",
    statusCode = 200,
    meta?: ApiMetaPayload
  ): NextResponse<ApiResponse<T>> {
    return this.success(data, message, statusCode, meta, {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });
  }

  /**
   * Return a Standardized Error Response (400, 401, 404, 429, 500, etc.)
   */
  static error(
    message: string,
    statusCode = 400,
    errorCode = "BAD_REQUEST",
    details?: unknown,
    headers?: Record<string, string>
  ): NextResponse<ApiResponse> {
    const errorPayload: ApiErrorPayload = {
      code: errorCode,
      details,
      timestamp: new Date().toISOString(),
    };

    const payload: ApiResponse = {
      success: false,
      message,
      error: errorPayload,
    };

    return NextResponse.json(payload, { status: statusCode, headers });
  }
}

