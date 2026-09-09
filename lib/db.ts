/**
 * @file lib/db.ts
 * @description Production-Hardened PostgreSQL / Supabase Database client using Drizzle ORM.
 * @purpose Initializes and exports singleton Drizzle instance bound to all 21 schemas with pool health diagnostics.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";
import { Logger } from "./logger";

// Database Connection String from environment
const connectionString = process.env.DATABASE_URL || "";

declare global {
  // eslint-disable-next-line no-var
  var __dbClient: ReturnType<typeof drizzle<typeof schema>> | undefined;
  // eslint-disable-next-line no-var
  var __pgClient: postgres.Sql | undefined;
}

function createDatabaseClient() {
  if (!connectionString) {
    Logger.warn("DATABASE_URL environment variable is not defined. Initializing database client in standby mode.");
    return null;
  }

  try {
    const isProd = process.env.NODE_ENV === "production";
    const maxConnections = process.env.DB_MAX_CONNECTIONS
      ? parseInt(process.env.DB_MAX_CONNECTIONS, 10)
      : isProd
      ? 20
      : 10;

    const pgClient =
      global.__pgClient ||
      postgres(connectionString, {
        max: maxConnections,
        idle_timeout: 20,
        connect_timeout: 10,
        max_lifetime: 60 * 30, // 30 minutes connection lifetime
        prepare: process.env.DB_PREPARE_STATEMENTS === "true", // Default false for PgBouncer / Transaction pooler safety
        onnotice: () => {}, // Suppress noisy notices in application logs
      });

    if (!isProd) {
      global.__pgClient = pgClient;
    }

    const drizzleDb = global.__dbClient || drizzle(pgClient, { schema });

    if (!isProd) {
      global.__dbClient = drizzleDb;
    }

    return drizzleDb;
  } catch (error) {
    Logger.error("Failed to initialize PostgreSQL connection pool", error);
    return null;
  }
}

export const db = createDatabaseClient();
export { schema };

/**
 * Diagnostic utility for operational health checks.
 * Measures database roundtrip latency and verifies connection readiness.
 */
export async function checkDatabaseHealth(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  if (!connectionString || !db) {
    return { ok: false, latencyMs: 0, error: "Database client is uninitialized or DATABASE_URL is missing." };
  }

  const startTime = Date.now();
  try {
    const rawPg = global.__pgClient || postgres(connectionString, { max: 1 });
    await rawPg`SELECT 1 as health_check`;
    const latencyMs = Date.now() - startTime;
    return { ok: true, latencyMs };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);
    Logger.error("Database health check failed", error);
    return { ok: false, latencyMs, error: errorMsg };
  }
}

