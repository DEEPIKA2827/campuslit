/**
 * scripts/validate-resources.ts
 *
 * CampusLit Resource Health Validator
 * Deep-scans resource links from the resource engine catalog.
 * Handles HTTP status, redirects, SSL errors, and YouTube HTML inspection
 * (detects "The playlist does not exist" and "undefined - YouTube").
 */

import {
  ACADEMIC_SUBJECT_CATALOG,
  VTU_GENERAL_OFFICIAL_RESOURCES,
  ROADMAP_NODE_RESOURCES,
  PROOF_OF_WORK_PROJECTS,
  VerifiedResource,
} from "../lib/resource-engine";

interface ResourceCheckResult {
  resourceId: string;
  title: string;
  sourceUrl: string;
  status: "healthy" | "redirected" | "dead" | "certificate_error" | "unknown";
  statusCode?: number;
  finalUrl?: string;
  reason?: string;
}

async function validateUrl(url: string): Promise<{
  status: "healthy" | "redirected" | "dead" | "certificate_error" | "unknown";
  statusCode?: number;
  finalUrl?: string;
  reason?: string;
}> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });

    const finalUrl = res.url;
    const isRedirected = finalUrl !== url && !finalUrl.startsWith(url);

    // If 404 or 5xx, clearly dead
    if (res.status >= 400) {
      return {
        status: "dead",
        statusCode: res.status,
        finalUrl,
        reason: `HTTP ${res.status}`,
      };
    }

    // YouTube-specific deep content inspection
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const text = await res.text();
      if (
        text.includes("The playlist does not exist") ||
        text.includes("<title>undefined - YouTube</title>") ||
        text.includes("This video isn't available anymore")
      ) {
        return {
          status: "dead",
          statusCode: res.status,
          finalUrl,
          reason: "YouTube body inspection indicated missing or deleted playlist/video",
        };
      }
    }

    if (isRedirected) {
      return {
        status: "redirected",
        statusCode: res.status,
        finalUrl,
        reason: `Redirected to ${finalUrl}`,
      };
    }

    return {
      status: "healthy",
      statusCode: res.status,
      finalUrl,
    };
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (
      msg.includes("CERT") ||
      msg.includes("certificate") ||
      msg.includes("unable to verify")
    ) {
      return {
        status: "certificate_error",
        reason: `SSL Certificate Issue: ${msg}`,
      };
    }
    return {
      status: "dead",
      reason: `Fetch failed: ${msg}`,
    };
  }
}

async function main() {
  console.log("==================================================");
  console.log("CAMPUSLIT RESOURCE LINK INTEGRITY AUDIT");
  console.log("==================================================");

  // Extract unique resources
  const resourceMap = new Map<string, VerifiedResource>();

  for (const r of VTU_GENERAL_OFFICIAL_RESOURCES) {
    if (r.sourceUrl) resourceMap.set(r.sourceUrl, r);
  }

  for (const subj of ACADEMIC_SUBJECT_CATALOG) {
    for (const r of subj.resources) {
      if (r.sourceUrl) resourceMap.set(r.sourceUrl, r);
    }
  }

  for (const node of Object.values(ROADMAP_NODE_RESOURCES)) {
    for (const d of node.officialDocs || []) if (d.sourceUrl) resourceMap.set(d.sourceUrl, d);
    for (const c of node.freeCourses || []) if (c.sourceUrl) resourceMap.set(c.sourceUrl, c);
    for (const e of node.youtube?.english || []) if (e.sourceUrl) resourceMap.set(e.sourceUrl, e);
    for (const h of node.youtube?.hindi || []) if (h.sourceUrl) resourceMap.set(h.sourceUrl, h);
    for (const k of node.youtube?.kannada || []) if (k.sourceUrl) resourceMap.set(k.sourceUrl, k);
    for (const p of node.practice || []) if (p.sourceUrl) resourceMap.set(p.sourceUrl, p);
  }

  for (const proj of PROOF_OF_WORK_PROJECTS) {
    if (proj.documentationUrl) {
      resourceMap.set(proj.documentationUrl, {
        resourceId: `pow_${proj.id}_doc`,
        title: `${proj.title} Documentation`,
        category: "notes",
        provider: "Documentation",
        sourceUrl: proj.documentationUrl,
        free: true,
        language: "english",
        lastVerifiedAt: "2026-09-01",
        official: false,
      });
    }
  }

  const allResources = Array.from(resourceMap.values());
  console.log(`Found ${allResources.length} unique resources to validate across catalog.\n`);

  const results: ResourceCheckResult[] = [];
  const counts = {
    TOTAL: allResources.length,
    HEALTHY: 0,
    REDIRECTED: 0,
    DEAD: 0,
    CERTIFICATE_ERROR: 0,
    UNKNOWN: 0,
  };

  // Run in chunks of 5 concurrency
  const CHUNK_SIZE = 5;
  for (let i = 0; i < allResources.length; i += CHUNK_SIZE) {
    const chunk = allResources.slice(i, i + CHUNK_SIZE);
    const chunkResults = await Promise.all(
      chunk.map(async (res) => {
        const check = await validateUrl(res.sourceUrl);
        return {
          resourceId: res.resourceId,
          title: res.title,
          sourceUrl: res.sourceUrl,
          status: check.status,
          statusCode: check.statusCode,
          finalUrl: check.finalUrl,
          reason: check.reason,
        };
      })
    );

    for (const r of chunkResults) {
      results.push(r);
      if (r.status === "healthy") counts.HEALTHY++;
      else if (r.status === "redirected") counts.REDIRECTED++;
      else if (r.status === "dead") counts.DEAD++;
      else if (r.status === "certificate_error") counts.CERTIFICATE_ERROR++;
      else counts.UNKNOWN++;

      const mark =
        r.status === "healthy"
          ? "✓ [HEALTHY]"
          : r.status === "redirected"
          ? "↪ [REDIRECTED]"
          : r.status === "certificate_error"
          ? "⚠ [CERT_ERROR]"
          : "✗ [DEAD]";

      console.log(`${mark} ${r.title.slice(0, 45).padEnd(45)} | ${r.sourceUrl}`);
      if (r.reason) console.log(`   -> Reason: ${r.reason}`);
    }
  }

  console.log("\n==================================================");
  console.log("RESOURCE AUDIT SUMMARY");
  console.log("==================================================");
  console.log(`TOTAL:             ${counts.TOTAL}`);
  console.log(`HEALTHY:           ${counts.HEALTHY}`);
  console.log(`REDIRECTED:        ${counts.REDIRECTED}`);
  console.log(`DEAD:              ${counts.DEAD}`);
  console.log(`CERTIFICATE_ERROR: ${counts.CERTIFICATE_ERROR}`);
  console.log(`UNKNOWN:           ${counts.UNKNOWN}`);
  console.log("==================================================");

  if (counts.DEAD > 0) {
    console.warn(`\n[WARNING] Found ${counts.DEAD} dead resource links in catalog!`);
    process.exit(1);
  } else {
    console.log("\n[SUCCESS] All checked resources are active and healthy.");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Resource validation script crashed:", err);
  process.exit(1);
});
