/**
 * @file app/api/assessments/high-frequency/route.ts
 * @description High-Frequency Question Analysis API for CampusOS.
 * @purpose Serves exam questions derived from historical VTU/Autonomous question paper analysis with transparent frequency ratios.
 * @security Public / Authenticated guest resilience.
 */

import { NextRequest } from "next/server";
import { ResponseBuilder } from "@/utils/api-response";
import academicResourcesData from "@/data/academic_resources.json";
import { Logger } from "@/lib/logger";

/**
 * GET /api/assessments/high-frequency
 * Query Parameters:
 * - courseId?: number
 * - courseCode?: string
 * - semester?: number
 * - minFrequency?: number (e.g. 0.8 for >= 80% occurrence)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseIdParam = searchParams.get("courseId");
    const courseCodeParam = searchParams.get("courseCode");
    const semesterParam = searchParams.get("semester");
    const minFrequencyParam = searchParams.get("minFrequency");

    let courses = [...academicResourcesData];

    if (courseIdParam && !isNaN(Number(courseIdParam))) {
      const cId = Number(courseIdParam);
      courses = courses.filter((c) => c.courseId === cId);
    }

    if (courseCodeParam && courseCodeParam.trim().length > 0) {
      const code = courseCodeParam.toLowerCase().trim();
      courses = courses.filter((c) => c.courseCode.toLowerCase() === code);
    }

    if (semesterParam && !isNaN(Number(semesterParam))) {
      const sem = Number(semesterParam);
      courses = courses.filter((c) => c.semester === sem);
    }

    let questions = courses.flatMap((c) =>
      c.highFrequencyQuestions.map((q) => ({
        ...q,
        courseId: c.courseId,
        courseCode: c.courseCode,
        courseName: c.courseName,
        semester: c.semester,
        scheme: c.scheme,
      }))
    );

    if (minFrequencyParam && !isNaN(Number(minFrequencyParam))) {
      const minFreq = Number(minFrequencyParam);
      questions = questions.filter((q) => q.frequencyRatio >= minFreq);
    }

    // Sort by frequency ratio descending, then occurrence count descending
    questions.sort((a, b) => b.frequencyRatio - a.frequencyRatio || b.occurrenceCount - a.occurrenceCount);

    Logger.info("GET /api/assessments/high-frequency", {
      totalQuestions: questions.length,
    });

    return ResponseBuilder.cached(
      {
        totalQuestions: questions.length,
        methodology: "Derived from multi-year VTU & Autonomous engineering examination question paper analysis (2021–2025).",
        questions,
      },
      "High frequency questions retrieved successfully.",
      1800,
      43200
    );
  } catch (error) {
    Logger.error("GET /api/assessments/high-frequency failed", error);
    return ResponseBuilder.error(
      "Failed to fetch high frequency questions",
      500,
      "INTERNAL_ERROR"
    );
  }
}
