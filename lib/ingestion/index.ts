/**
 * @file lib/ingestion/index.ts
 * @description Catalog Ingestion Orchestrator for CampusLit.
 * @purpose Coordinates reading CSV/JSON master feeds, running validation, and populating PostgreSQL.
 */

import fs from "fs";
import path from "path";
import { CatalogValidator } from "./catalog-validator";
import { CsvCatalogParser } from "./csv-parser";
import {
  IngestedScholarship,
  IngestedOpportunity,
  IngestedCourseVault,
  IngestionValidationResult,
} from "./types";
import { Logger } from "@/lib/logger";

export class CatalogIngestionEngine {
  /**
   * Loads and validates scholarships from either JSON or CSV master file with failure recovery.
   */
  static loadScholarships(filePath?: string): IngestionValidationResult<IngestedScholarship> {
    const targetPath = filePath || path.resolve(process.cwd(), "data/scholarships.json");
    if (!fs.existsSync(targetPath)) {
      Logger.error(`Scholarship master file not found at: ${targetPath}`);
      return {
        validRecords: [],
        rejectedRecords: [{ record: null, reasons: [`File not found at ${targetPath}`], index: 0 }],
        totalParsed: 0,
        validCount: 0,
        rejectedCount: 1,
      };
    }

    try {
      const content = fs.readFileSync(targetPath, "utf8");
      let rawItems: unknown[] = [];

      if (targetPath.endsWith(".csv")) {
        rawItems = CsvCatalogParser.parseCsv(content, {
          arrayColumns: ["tags", "documentsRequired"],
          numericColumns: ["scholarshipId", "annualValue"],
        });
      } else {
        try {
          rawItems = JSON.parse(content);
        } catch (jsonErr) {
          Logger.error("Failed to parse JSON scholarships", jsonErr);
          return {
            validRecords: [],
            rejectedRecords: [{ record: content.slice(0, 100), reasons: ["Malformed JSON syntax"], index: 0 }],
            totalParsed: 0,
            validCount: 0,
            rejectedCount: 1,
          };
        }
      }

      if (!Array.isArray(rawItems)) {
        return {
          validRecords: [],
          rejectedRecords: [{ record: rawItems, reasons: ["Root content must be a JSON array"], index: 0 }],
          totalParsed: 0,
          validCount: 0,
          rejectedCount: 1,
        };
      }

      const result = CatalogValidator.validateScholarships(rawItems);
      Logger.info("CatalogIngestionEngine.loadScholarships", {
        total: result.totalParsed,
        valid: result.validCount,
        rejected: result.rejectedCount,
      });

      return result;
    } catch (err) {
      Logger.error("CatalogIngestionEngine.loadScholarships unexpected error", err);
      return {
        validRecords: [],
        rejectedRecords: [{ record: null, reasons: [String(err)], index: 0 }],
        totalParsed: 0,
        validCount: 0,
        rejectedCount: 1,
      };
    }
  }

  /**
   * Loads and validates opportunities from either JSON or CSV master file with failure recovery.
   */
  static loadOpportunities(filePath?: string): IngestionValidationResult<IngestedOpportunity> {
    const targetPath = filePath || path.resolve(process.cwd(), "data/opportunities.json");
    if (!fs.existsSync(targetPath)) {
      Logger.error(`Opportunities master file not found at: ${targetPath}`);
      return {
        validRecords: [],
        rejectedRecords: [{ record: null, reasons: [`File not found at ${targetPath}`], index: 0 }],
        totalParsed: 0,
        validCount: 0,
        rejectedCount: 1,
      };
    }

    try {
      const content = fs.readFileSync(targetPath, "utf8");
      let rawItems: unknown[] = [];

      if (targetPath.endsWith(".csv")) {
        rawItems = CsvCatalogParser.parseCsv(content, {
          arrayColumns: ["tags", "batch"],
          numericColumns: ["opportunityId", "minCGPA"],
          booleanColumns: ["isPaid", "isUrgent", "teammatesNeeded"],
        });
      } else {
        try {
          rawItems = JSON.parse(content);
        } catch (jsonErr) {
          Logger.error("Failed to parse JSON opportunities", jsonErr);
          return {
            validRecords: [],
            rejectedRecords: [{ record: content.slice(0, 100), reasons: ["Malformed JSON syntax"], index: 0 }],
            totalParsed: 0,
            validCount: 0,
            rejectedCount: 1,
          };
        }
      }

      if (!Array.isArray(rawItems)) {
        return {
          validRecords: [],
          rejectedRecords: [{ record: rawItems, reasons: ["Root content must be a JSON array"], index: 0 }],
          totalParsed: 0,
          validCount: 0,
          rejectedCount: 1,
        };
      }

      const result = CatalogValidator.validateOpportunities(rawItems);
      Logger.info("CatalogIngestionEngine.loadOpportunities", {
        total: result.totalParsed,
        valid: result.validCount,
        rejected: result.rejectedCount,
      });

      return result;
    } catch (err) {
      Logger.error("CatalogIngestionEngine.loadOpportunities unexpected error", err);
      return {
        validRecords: [],
        rejectedRecords: [{ record: null, reasons: [String(err)], index: 0 }],
        totalParsed: 0,
        validCount: 0,
        rejectedCount: 1,
      };
    }
  }

  /**
   * Loads and validates hierarchical academic resource vaults with failure recovery.
   */
  static loadAcademicResources(filePath?: string): IngestionValidationResult<IngestedCourseVault> {
    const targetPath = filePath || path.resolve(process.cwd(), "data/academic_resources.json");
    if (!fs.existsSync(targetPath)) {
      Logger.error(`Academic resources master file not found at: ${targetPath}`);
      return {
        validRecords: [],
        rejectedRecords: [{ record: null, reasons: [`File not found at ${targetPath}`], index: 0 }],
        totalParsed: 0,
        validCount: 0,
        rejectedCount: 1,
      };
    }

    try {
      const content = fs.readFileSync(targetPath, "utf8");
      let rawItems: unknown[] = [];
      try {
        rawItems = JSON.parse(content);
      } catch (jsonErr) {
        Logger.error("Failed to parse JSON academic resources", jsonErr);
        return {
          validRecords: [],
          rejectedRecords: [{ record: content.slice(0, 100), reasons: ["Malformed JSON syntax"], index: 0 }],
          totalParsed: 0,
          validCount: 0,
          rejectedCount: 1,
        };
      }

      if (!Array.isArray(rawItems)) {
        return {
          validRecords: [],
          rejectedRecords: [{ record: rawItems, reasons: ["Root content must be a JSON array"], index: 0 }],
          totalParsed: 0,
          validCount: 0,
          rejectedCount: 1,
        };
      }

      const result = CatalogValidator.validateCourseVaults(rawItems);
      Logger.info("CatalogIngestionEngine.loadAcademicResources", {
        total: result.totalParsed,
        valid: result.validCount,
        rejected: result.rejectedCount,
      });

      return result;
    } catch (err) {
      Logger.error("CatalogIngestionEngine.loadAcademicResources unexpected error", err);
      return {
        validRecords: [],
        rejectedRecords: [{ record: null, reasons: [String(err)], index: 0 }],
        totalParsed: 0,
        validCount: 0,
        rejectedCount: 1,
      };
    }
  }

  /**
   * Preflight verification of all catalog datasets without writing to database.
   */
  static verifyAllCatalogues(): {
    scholarships: IngestionValidationResult<IngestedScholarship>;
    opportunities: IngestionValidationResult<IngestedOpportunity>;
    academicResources: IngestionValidationResult<IngestedCourseVault>;
    allValid: boolean;
  } {
    const scholarships = this.loadScholarships();
    const opportunities = this.loadOpportunities();
    const academicResources = this.loadAcademicResources();

    const allValid =
      scholarships.rejectedCount === 0 &&
      opportunities.rejectedCount === 0 &&
      academicResources.rejectedCount === 0;

    return {
      scholarships,
      opportunities,
      academicResources,
      allValid,
    };
  }
}

export * from "./types";
export * from "./catalog-validator";
export * from "./csv-parser";
