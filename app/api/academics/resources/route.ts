/**
 * @file app/api/academics/resources/route.ts
 * @description Academic Resource Vault API for CampusLit.
 * @purpose Serves hierarchical subject notes, model papers, lab manuals, and video resources with canonical source attribution.
 * @security Public / Authenticated guest resilience.
 */

import { NextRequest } from "next/server";
import { ResponseBuilder } from "@/utils/api-response";
import academicResourcesData from "@/data/academic_resources.json";
import { Logger } from "@/lib/logger";

/**
 * GET /api/academics/resources
 * Query Parameters:
 * - branch?: string (e.g. "Computer Science & Engineering")
 * - semester?: number (e.g. 3, 4, 5, 6)
 * - courseId?: number
 * - type?: string (e.g. "Notes", "Lab Manuals", "Model Papers", "All")
 * - search?: string
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchParam = searchParams.get("branch");
    const semesterParam = searchParams.get("semester");
    const courseIdParam = searchParams.get("courseId");
    const typeParam = searchParams.get("type");
    const searchParam = searchParams.get("search");

    let filteredCourses = [...academicResourcesData];

    if (branchParam && branchParam.trim().length > 0) {
      filteredCourses = filteredCourses.filter((c) =>
        c.branch.toLowerCase().includes(branchParam.toLowerCase().trim())
      );
    }

    if (semesterParam && !isNaN(Number(semesterParam))) {
      const sem = Number(semesterParam);
      filteredCourses = filteredCourses.filter((c) => c.semester === sem);
    }

    if (courseIdParam && !isNaN(Number(courseIdParam))) {
      const cId = Number(courseIdParam);
      filteredCourses = filteredCourses.filter((c) => c.courseId === cId);
    }

    // Flatten resources with parent course metadata
    let allResources = filteredCourses.flatMap((c) =>
      c.resources.map((r) => ({
        ...r,
        courseId: c.courseId,
        courseCode: c.courseCode,
        courseName: c.courseName,
        branch: c.branch,
        semester: c.semester,
        scheme: c.scheme,
      }))
    );

    if (typeParam && typeParam.trim().length > 0 && typeParam.toLowerCase() !== "all") {
      const typeTerm = typeParam.toLowerCase().trim();
      allResources = allResources.filter((r) =>
        r.type.toLowerCase().includes(typeTerm)
      );
    }

    if (searchParam && searchParam.trim().length > 0) {
      const s = searchParam.toLowerCase().trim();
      allResources = allResources.filter(
        (r) =>
          r.title.toLowerCase().includes(s) ||
          r.courseName.toLowerCase().includes(s) ||
          r.courseCode.toLowerCase().includes(s) ||
          r.source.toLowerCase().includes(s) ||
          r.type.toLowerCase().includes(s)
      );
    }

    Logger.info("GET /api/academics/resources", {
      totalCourses: filteredCourses.length,
      returnedResources: allResources.length,
    });

    return ResponseBuilder.cached(
      {
        courses: filteredCourses.map((c) => ({
          courseId: c.courseId,
          courseCode: c.courseCode,
          courseName: c.courseName,
          branch: c.branch,
          semester: c.semester,
          scheme: c.scheme,
          resourceCount: c.resources.length,
          highFrequencyCount: c.highFrequencyQuestions.length,
          vivaCount: c.vivaQuestions.length,
        })),
        resources: allResources,
        totalCount: allResources.length,
      },
      "Academic resources retrieved successfully.",
      1800,
      43200
    );
  } catch (error) {
    Logger.error("GET /api/academics/resources failed", error);
    return ResponseBuilder.error(
      "Failed to fetch academic resource vault",
      500,
      "INTERNAL_ERROR"
    );
  }
}
