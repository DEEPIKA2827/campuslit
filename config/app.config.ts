
/**
 * @file config/app.config.ts
 * @description Central application configuration settings, API defaults, and feature flags.
 * @purpose Serves as the single source of truth for global application constants.
 */

export const APP_CONFIG = {
  name: "CampusLit API",
  version: "1.0.0",
  environment: process.env.NODE_ENV || "development",
  apiPrefix: "/api",
  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : ["http://localhost:3000"],
  },
  // TODO: Add feature flags (e.g. enableAiMentor, enableScholarshipNotifications)
} as const;

export type AppConfig = typeof APP_CONFIG;
