/**
 * @file scripts/ingest-catalog.ts
 * @description Standalone CLI utility to validate and ingest catalog feeds into CampusLit database.
 * @usage npx tsx scripts/ingest-catalog.ts
 */

import { runSeed } from "../db/seed";
import { Logger } from "../lib/logger";

async function main() {
  Logger.info("Executing Catalog Ingestion Pipeline...");
  try {
    await runSeed();
    Logger.info("Catalog Ingestion Pipeline completed successfully.");
    process.exit(0);
  } catch (error) {
    Logger.error("Catalog Ingestion Pipeline failed", error);
    process.exit(1);
  }
}

main();
