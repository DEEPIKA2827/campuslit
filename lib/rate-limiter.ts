/**
 * @file lib/rate-limiter.ts
 * @description In-memory high-performance sliding-window rate limiter for API requests.
 * @purpose Protects authentication and mutating endpoints against brute-force attacks and DDoS.
 */

export interface RateLimitTier {
  limit: number;
  windowSeconds: number;
}

export const RATE_LIMIT_TIERS = {
  AUTH: { limit: process.env.NODE_ENV === "production" ? 30 : 200, windowSeconds: 60 }, // Auth login/register
  MUTATION: { limit: process.env.NODE_ENV === "production" ? 120 : 500, windowSeconds: 60 }, // POST / PATCH / DELETE
  READ: { limit: process.env.NODE_ENV === "production" ? 300 : 1000, windowSeconds: 60 }, // General GET
  AI_MENTOR: { limit: process.env.NODE_ENV === "production" ? 10 : 30, windowSeconds: 60 }, // Dedicated server-side AI Mentor request limit
  UNLIMITED: { limit: 10000, windowSeconds: 60 }, // Test/bypass
} as const;

interface ClientWindow {
  timestamps: number[];
  lastCleanup: number;
}

class InMemoryRateLimiter {
  private static instance: InMemoryRateLimiter;
  private clientStore: Map<string, ClientWindow> = new Map();
  private lastGlobalCleanup = Date.now();

  private constructor() {}

  static getInstance(): InMemoryRateLimiter {
    if (!InMemoryRateLimiter.instance) {
      InMemoryRateLimiter.instance = new InMemoryRateLimiter();
    }
    return InMemoryRateLimiter.instance;
  }

  /**
   * Evaluates whether a client identifier (IP / token) is within the rate limit.
   */
  check(
    identifier: string,
    tier: RateLimitTier = RATE_LIMIT_TIERS.READ
  ): {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetSeconds: number;
    retryAfter: number;
  } {
    const now = Date.now();
    const windowMs = tier.windowSeconds * 1000;
    const windowStart = now - windowMs;

    // Periodic cleanup every 5 minutes
    if (now - this.lastGlobalCleanup > 300000) {
      this.cleanup(now);
    }

    let client = this.clientStore.get(identifier);
    if (!client) {
      client = { timestamps: [], lastCleanup: now };
      this.clientStore.set(identifier, client);
    }

    // Filter timestamps within active window
    client.timestamps = client.timestamps.filter((ts) => ts > windowStart);
    client.lastCleanup = now;

    const currentCount = client.timestamps.length;
    const oldestTimestamp = client.timestamps[0] || now;
    const resetSeconds = Math.max(1, Math.ceil((oldestTimestamp + windowMs - now) / 1000));

    if (currentCount >= tier.limit) {
      const retryAfter = resetSeconds;
      return {
        allowed: false,
        limit: tier.limit,
        remaining: 0,
        resetSeconds,
        retryAfter,
      };
    }

    // Record this request
    client.timestamps.push(now);
    const remaining = tier.limit - client.timestamps.length;

    return {
      allowed: true,
      limit: tier.limit,
      remaining: Math.max(0, remaining),
      resetSeconds,
      retryAfter: 0,
    };
  }

  /**
   * Resets rate limits for a specific identifier (useful for tests).
   */
  reset(identifier: string): void {
    this.clientStore.delete(identifier);
  }

  /**
   * Cleans up stale client windows.
   */
  private cleanup(now: number): void {
    this.lastGlobalCleanup = now;
    const maxStaleMs = 300000; // 5 minutes
    for (const [key, client] of this.clientStore.entries()) {
      if (now - client.lastCleanup > maxStaleMs) {
        this.clientStore.delete(key);
      }
    }
  }
}

export const rateLimiter = InMemoryRateLimiter.getInstance();
