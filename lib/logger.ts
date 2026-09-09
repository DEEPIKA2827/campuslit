/**
 * @file lib/logger.ts
 * @description Centralized structured logging abstraction layer.
 * @purpose Provides structured logging for API requests, errors, and system events with JSON production formatting.
 */

export type LogLevel = "info" | "warn" | "error" | "debug";

export class Logger {
  private static formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const isProd = process.env.NODE_ENV === "production";

    if (isProd) {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...(context && { context }),
      });
    }

    const contextString = context ? ` | ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextString}`;
  }

  static info(message: string, context?: Record<string, unknown>): void {
    console.log(this.formatMessage("info", message, context));
  }

  static warn(message: string, context?: Record<string, unknown>): void {
    console.warn(this.formatMessage("warn", message, context));
  }

  static error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    const errorDetails = error instanceof Error ? error.stack || error.message : String(error);
    console.error(this.formatMessage("error", message, { ...context, errorDetails }));
  }

  static debug(message: string, context?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.formatMessage("debug", message, context));
    }
  }

  static apiRequest(method: string, path: string, status: number, durationMs: number, context?: Record<string, unknown>): void {
    const level: LogLevel = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
    this[level](`HTTP ${method} ${path} -> ${status} (${durationMs}ms)`, {
      http: { method, path, status, durationMs },
      ...context,
    });
  }
}

