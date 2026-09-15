/**
 * @file lib/env.ts
 * @description Environment variable accessor and validation singleton.
 * @purpose Safely retrieves environment configuration and guarantees required secrets exist.
 */

export interface EnvironmentVariables {
  NODE_ENV: string;
  DATABASE_URL?: string;
  DIRECT_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
  AUTH_SESSION_SECRET?: string;
  AUTH_SESSION_SECRETS?: string;
  DB_MAX_CONNECTIONS?: string;
  GEMINI_API_KEY?: string;
  XAI_API_KEY?: string;
  XAI_MODEL?: string;
}

class EnvManager {
  private static instance: EnvManager;

  private constructor() {}

  public static getInstance(): EnvManager {
    if (!EnvManager.instance) {
      EnvManager.instance = new EnvManager();
    }
    return EnvManager.instance;
  }

  /**
   * Safely retrieves an environment variable or returns default.
   */
  public get(key: keyof EnvironmentVariables, defaultValue = ""): string {
    return process.env[key] || defaultValue;
  }

  /**
   * Validates required database and security keys at application boot time.
   */
  public validateEnv(): { valid: boolean; missing: string[] } {
    const isProd = process.env.NODE_ENV === "production";
    const missing: string[] = [];

    if (!process.env.DATABASE_URL) {
      missing.push("DATABASE_URL");
    }

    if (!process.env.AUTH_SESSION_SECRET && !process.env.AUTH_SESSION_SECRETS) {
      missing.push("AUTH_SESSION_SECRET / AUTH_SESSION_SECRETS");
    }

    if (missing.length > 0) {
      const msg = `[Env Error] Missing mandatory configuration keys: ${missing.join(", ")}`;
      if (isProd) {
        console.error(msg);
        throw new Error(msg);
      } else {
        console.warn(`[Env Warning] Missing configuration keys: ${missing.join(", ")}`);
      }
      return { valid: false, missing };
    }

    return { valid: true, missing: [] };
  }
}

export const env = EnvManager.getInstance();
