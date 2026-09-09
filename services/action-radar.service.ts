/**
 * @file services/action-radar.service.ts
 * @description Proactive Action Layer & Multi-Domain Prioritization Engine for CampusOS.
 * @purpose Connects Attendance, Academics/Exams, Deadlines, and Roadmaps into a deterministic Rule-of-One mission control.
 */

import {
  ActionAlertItemDTO,
  ActionCandidate,
  ActionCategory,
  ActionRadarResponseDTO,
  ActionTimelineItemDTO,
  PrimaryMissionDTO,
  RadarMetricsDTO,
} from "@/types/action-radar.types";
import { AttendanceRepository } from "@/repositories/attendance.repository";
import { AssessmentRepository } from "@/repositories/assessment.repository";
import { AcademicRepository } from "@/repositories/academic.repository";
import { ScholarshipRepository } from "@/repositories/scholarship.repository";
import { OpportunityRepository } from "@/repositories/opportunity.repository";
import { RoadmapRepository } from "@/repositories/roadmap.repository";
import { CatalogIngestionEngine } from "@/lib/ingestion";
import { Logger } from "@/lib/logger";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

const CATEGORY_TIER_ORDER: Record<ActionCategory, number> = {
  attendance_recovery: 1,
  deadline_submission: 2,
  exam_priority: 3,
  roadmap_milestone: 4,
  discovery_recommendation: 5,
};

export class ActionRadarService {
  private attendanceRepo: AttendanceRepository;
  private assessmentRepo: AssessmentRepository;
  private academicRepo: AcademicRepository;
  private scholarshipRepo: ScholarshipRepository;
  private opportunityRepo: OpportunityRepository;
  private roadmapRepo: RoadmapRepository;

  constructor() {
    this.attendanceRepo = new AttendanceRepository();
    this.assessmentRepo = new AssessmentRepository();
    this.academicRepo = new AcademicRepository();
    this.scholarshipRepo = new ScholarshipRepository();
    this.opportunityRepo = new OpportunityRepository();
    this.roadmapRepo = new RoadmapRepository();
  }

  /**
   * Helper to parse a YYYY-MM-DD date string into End-Of-Day Indian Standard Time (IST / UTC+05:30) timestamp.
   */
  private parseEodIst(dateString?: string | null): number | null {
    if (!dateString) return null;
    const cleanDate = dateString.trim().split("T")[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) return null;
    return new Date(`${cleanDate}T23:59:59.999+05:30`).getTime();
  }

  /**
   * Deterministic multi-tier comparator for candidate action items.
   */
  private compareCandidates(a: ActionCandidate, b: ActionCandidate): number {
    // Primary: Composite Priority Score (Highest first)
    if (b.compositeScore !== a.compositeScore) {
      return b.compositeScore - a.compositeScore;
    }

    // Tier 1: Category Priority Order
    const catA = CATEGORY_TIER_ORDER[a.category] ?? 99;
    const catB = CATEGORY_TIER_ORDER[b.category] ?? 99;
    if (catA !== catB) {
      return catA - catB;
    }

    // Tier 2: Absolute Time Proximity (Soonest first)
    if (a.timeProximitySeconds !== b.timeProximitySeconds) {
      return a.timeProximitySeconds - b.timeProximitySeconds;
    }

    // Tier 3: Severity Deficit Magnitude (Largest first)
    if (b.severityMagnitude !== a.severityMagnitude) {
      return b.severityMagnitude - a.severityMagnitude;
    }

    // Tier 4: Stable Natural Key (Ascending string sort)
    return a.id.localeCompare(b.id);
  }

  /**
   * Build the complete Action Radar payload for an authenticated student.
   */
  public async buildRadarPayload(userId: number): Promise<ActionRadarResponseDTO> {
    try {
      const now = Date.now();
      const candidates: ActionCandidate[] = [];

      // -----------------------------------------------------------------------
      // 1. EVALUATE ATTENDANCE SIGNALS
      // -----------------------------------------------------------------------
      const attendanceSummaries = await this.attendanceRepo.getSummariesWithCourseDetails(userId);
      let totalAttClasses = 0;
      let totalConductedClasses = 0;
      let atRiskCoursesCount = 0;

      for (const summary of attendanceSummaries) {
        let attended = summary.attendedClasses || 0;
        const total = summary.totalClasses || 0;

        // Data invariant clamping
        if (attended > total) attended = total;

        totalAttClasses += attended;
        totalConductedClasses += total;

        const currentPct = total > 0 ? (attended / total) * 100 : 100;
        const courseName = summary.courseName || `Course #${summary.courseId}`;
        const courseCode = summary.courseCode || `CS${summary.courseId}`;

        if (currentPct < 75 && total > 0) {
          atRiskCoursesCount++;
          const needed = Math.max(0, Math.ceil((0.75 * total - attended) / 0.25));
          const gap = 75 - currentPct;

          // Check if actual remaining scheduled classes are provided
          const remainingScheduled = (summary as any).remainingClasses;
          let isImpossible = false;
          let recoveryNote = "";
          let actionLabel = `Attend Next ${needed} Classes`;
          let actionUrl = `/attendance?courseId=${summary.courseId}`;
          let baseScore = 900 + Math.round(gap * 2);

          if (typeof remainingScheduled === "number" && remainingScheduled >= 0) {
            if (needed > remainingScheduled) {
              isImpossible = true;
              recoveryNote = `Mathematically impossible to reach 75% (${needed} needed > ${remainingScheduled} remaining). Institutional condonation may be required.`;
              actionLabel = "File Condonation Application";
              actionUrl = `/attendance?condonation=true&courseId=${summary.courseId}`;
              baseScore = 1000;
            } else {
              recoveryNote = `Requires ${needed} of ${remainingScheduled} remaining classes to reach 75%.`;
            }
          } else {
            recoveryNote = `Estimated ${needed} consecutive classes needed (remaining schedule not specified).`;
          }

          candidates.push({
            id: `att_${summary.courseId}`,
            category: "attendance_recovery",
            urgency: "critical",
            compositeScore: baseScore,
            timeProximitySeconds: 0,
            severityMagnitude: Math.round(gap * 100),
            title: isImpossible ? `Irreversible Shortage Risk: ${courseCode}` : `Attendance Recovery: ${courseCode}`,
            subtitle: `${courseName} is at ${currentPct.toFixed(1)}% (Threshold: 75.0%)`,
            description: recoveryNote,
            estimatedMinutes: 50,
            xpReward: 30,
            actionUrl,
            actionLabel,
            contextBadge: `75% Bunk Defense (${currentPct.toFixed(1)}%)`,
            metricLabel: "Current Attendance",
            metricValue: `${currentPct.toFixed(1)}%`,
            isImpossibleRecovery: isImpossible,
            recoveryNote,
          });
        } else if (currentPct >= 75 && currentPct < 80 && total > 0) {
          const safeBunks = Math.max(0, Math.floor((attended - 0.75 * total) / 0.75));
          const gap = 80 - currentPct;

          candidates.push({
            id: `att_warn_${summary.courseId}`,
            category: "attendance_recovery",
            urgency: "high",
            compositeScore: 600 + Math.round(gap * 5),
            timeProximitySeconds: 86400,
            severityMagnitude: Math.round(gap * 100),
            title: `Attendance Warning: ${courseCode}`,
            subtitle: `${courseName} is at ${currentPct.toFixed(1)}% (Tight Buffer: ${safeBunks} bunks left)`,
            description: `Maintain regular attendance to prevent slipping into the <75% debarment zone.`,
            estimatedMinutes: 50,
            xpReward: 20,
            actionUrl: `/attendance?courseId=${summary.courseId}`,
            actionLabel: "View Bunk Defense",
            contextBadge: `Buffer: ${safeBunks} Bunks`,
            metricLabel: "Current Attendance",
            metricValue: `${currentPct.toFixed(1)}%`,
          });
        }
      }

      const overallAttendance =
        totalConductedClasses > 0
          ? Number(((totalAttClasses / totalConductedClasses) * 100).toFixed(1))
          : 100.0;

      // -----------------------------------------------------------------------
      // 2. EVALUATE ASSESSMENTS & HIGH-FREQUENCY EXAM PRIORITIES
      // -----------------------------------------------------------------------
      // Load all courses and academic vault resources for high-frequency mapping
      const academicVault = CatalogIngestionEngine.loadAcademicResources();
      const vaultMap = new Map(academicVault.validRecords.map((c) => [c.courseCode.toUpperCase(), c]));

      // Check upcoming CIEs across all student courses
      for (const summary of attendanceSummaries) {
        if (!summary.courseId) continue;
        const cies = await this.assessmentRepo.listCieAssessments(summary.courseId);
        const courseCode = summary.courseCode?.toUpperCase() || "";
        const vaultCourse = vaultMap.get(courseCode);

        for (const cie of cies) {
          const eodTimestamp = this.parseEodIst(cie.assessmentDate);
          if (!eodTimestamp) continue;

          const diffMs = eodTimestamp - now;
          if (diffMs < 0) continue; // Past assessment

          const diffDays = Math.floor(diffMs / 86400000);
          const diffHours = Math.max(0, Math.floor(diffMs / 3600000));

          if (diffDays <= 14) {
            let score = 400;
            let urgency: "critical" | "high" | "medium" = "medium";

            if (diffDays <= 3) {
              score = 850 + (3 - diffDays) * 30;
              urgency = "critical";
            } else if (diffDays <= 7) {
              score = 700 + (7 - diffDays) * 15;
              urgency = "high";
            }

            // Find top high-frequency question for this course
            const topHfq = vaultCourse?.highFrequencyQuestions?.[0];
            let subtitle = `${cie.assessmentName} scheduled in ${diffDays === 0 ? "today" : `${diffDays} days`}`;
            let hfqNote = "";

            if (topHfq) {
              const recurrencePct = Math.round(topHfq.frequencyRatio * 100);
              if (topHfq.isSufficientData) {
                hfqNote = `Observed High Recurrence Pattern (${recurrencePct}% in analyzed VTU papers): "${topHfq.question}"`;
              } else {
                hfqNote = `Insufficient data (Less than 3 papers analyzed): "${topHfq.question}"`;
              }
              subtitle += ` • Focus: Module ${topHfq.module} (${topHfq.typicalMarks} marks)`;
            }

            candidates.push({
              id: `exam_${cie.cieId}`,
              category: "exam_priority",
              urgency,
              compositeScore: score,
              timeProximitySeconds: Math.floor(diffMs / 1000),
              severityMagnitude: Math.round(cie.maxMarks || 50),
              title: `Exam Priority: ${courseCode} ${cie.assessmentName}`,
              subtitle,
              description: hfqNote || `Prepare notes and previous-year question sets for ${cie.assessmentName}.`,
              estimatedMinutes: 45,
              xpReward: 50,
              actionUrl: `/academics?courseId=${summary.courseId}&tab=pyqs`,
              actionLabel: "Master High-Frequency Questions",
              contextBadge: diffDays <= 2 ? `Exam in ${diffHours}h` : `Exam in ${diffDays}d`,
              dueInDays: diffDays,
              dueInHours: diffHours,
              attachedResource: topHfq
                ? {
                    title: `Module ${topHfq.module} High-Frequency Exam Guide`,
                    url: `/academics?courseId=${summary.courseId}`,
                    type: "High-Frequency PYQ",
                  }
                : undefined,
            });
          }
        }
      }

      // -----------------------------------------------------------------------
      // 3. EVALUATE SCHOLARSHIPS & OPPORTUNITIES DEADLINES
      // -----------------------------------------------------------------------
      let upcomingDeadlinesCount = 0;

      // Bookmarked Scholarships
      const bookmarkedSchs = await this.scholarshipRepo.getUserBookmarkedScholarships(userId);
      for (const item of bookmarkedSchs) {
        const sch = item.scholarship;
        const eodTimestamp = this.parseEodIst(sch.deadline);

        if (eodTimestamp === null) {
          // Open all year / rolling
          candidates.push({
            id: `sch_roll_${sch.scholarshipId}`,
            category: "deadline_submission",
            urgency: "low",
            compositeScore: 150,
            timeProximitySeconds: 99999999,
            severityMagnitude: 10,
            title: `Scholarship Application: ${sch.scholarshipName}`,
            subtitle: `Open All Year • Rolling Submissions Available`,
            description: `${sch.description} • Apply via official portal.`,
            estimatedMinutes: 30,
            xpReward: 40,
            actionUrl: sch.applicationUrl || "/scholarships",
            actionLabel: "Apply on Portal",
            contextBadge: "Open All Year",
          });
          continue;
        }

        const diffMs = eodTimestamp - now;
        if (diffMs < 0) continue; // Expired

        const diffDays = Math.floor(diffMs / 86400000);
        const diffHours = Math.max(0, Math.floor(diffMs / 3600000));
        upcomingDeadlinesCount++;

        let score = 350;
        let urgency: "critical" | "high" | "medium" = "medium";

        if (diffHours <= 48) {
          score = 950 + Math.max(0, 48 - diffHours);
          urgency = "critical";
        } else if (diffDays <= 7) {
          score = 750 + (7 - diffDays) * 20;
          urgency = "high";
        }

        candidates.push({
          id: `sch_${sch.scholarshipId}`,
          category: "deadline_submission",
          urgency,
          compositeScore: score,
          timeProximitySeconds: Math.floor(diffMs / 1000),
          severityMagnitude: 50,
          title: `Scholarship Deadline: ${sch.scholarshipName}`,
          subtitle: `Application window closing in ${diffDays === 0 ? `${diffHours} hours` : `${diffDays} days`}`,
          description: `Complete verification documents and submit application on official portal.`,
          estimatedMinutes: 30,
          xpReward: 50,
          actionUrl: sch.applicationUrl || "/scholarships",
          actionLabel: "Complete Application",
          contextBadge: diffHours <= 48 ? `Closes in ${diffHours}h` : `Closes in ${diffDays}d`,
          dueInDays: diffDays,
          dueInHours: diffHours,
        });
      }

      // Tracked Opportunities
      const trackedOpps = await this.opportunityRepo.getStudentOpportunities(userId);
      for (const item of trackedOpps) {
        const opp = item.opportunity;
        const eodTimestamp = this.parseEodIst(opp.deadline);

        if (eodTimestamp === null) {
          // Open all year / rolling
          candidates.push({
            id: `opp_roll_${opp.opportunityId}`,
            category: "deadline_submission",
            urgency: "low",
            compositeScore: 150,
            timeProximitySeconds: 99999999,
            severityMagnitude: 10,
            title: `Opportunity Track: ${opp.title}`,
            subtitle: `${opp.company} • Continuous Hiring / Open Application`,
            description: `${opp.description}`,
            estimatedMinutes: 25,
            xpReward: 35,
            actionUrl: opp.applicationUrl || "/opportunities",
            actionLabel: "Submit Application",
            contextBadge: "Continuous Hiring",
          });
          continue;
        }

        const diffMs = eodTimestamp - now;
        if (diffMs < 0) continue; // Expired

        const diffDays = Math.floor(diffMs / 86400000);
        const diffHours = Math.max(0, Math.floor(diffMs / 3600000));
        upcomingDeadlinesCount++;

        let score = 350;
        let urgency: "critical" | "high" | "medium" = "medium";

        if (diffHours <= 48) {
          score = 950 + Math.max(0, 48 - diffHours);
          urgency = "critical";
        } else if (diffDays <= 7) {
          score = 750 + (7 - diffDays) * 20;
          urgency = "high";
        }

        candidates.push({
          id: `opp_${opp.opportunityId}`,
          category: "deadline_submission",
          urgency,
          compositeScore: score,
          timeProximitySeconds: Math.floor(diffMs / 1000),
          severityMagnitude: 60,
          title: `Opportunity Deadline: ${opp.title} (${opp.company})`,
          subtitle: `Application window closing in ${diffDays === 0 ? `${diffHours} hours` : `${diffDays} days`}`,
          description: `Submit proposal / profile before portal registration cutoff.`,
          estimatedMinutes: 25,
          xpReward: 50,
          actionUrl: opp.applicationUrl || "/opportunities",
          actionLabel: "Apply Now",
          contextBadge: diffHours <= 48 ? `Closes in ${diffHours}h` : `Closes in ${diffDays}d`,
          dueInDays: diffDays,
          dueInHours: diffHours,
        });
      }

      // -----------------------------------------------------------------------
      // 4. EVALUATE ROADMAP MILESTONES
      // -----------------------------------------------------------------------
      const roadmaps = await this.roadmapRepo.listRoadmaps();
      let activeRoadmapTitle = "Full-Stack Web Developer Roadmap";
      let activeRoadmapProgressPct = 0;

      if (roadmaps.length > 0) {
        const primaryRoadmap = roadmaps[0];
        activeRoadmapTitle = primaryRoadmap.title;
        const nodeProgressList = await this.roadmapRepo.getStudentProgressForRoadmap(userId, primaryRoadmap.roadmapId);

        const totalNodes = nodeProgressList.length;
        const completedCount = nodeProgressList.filter((item) => item.progress?.status === "completed").length;
        activeRoadmapProgressPct = totalNodes > 0 ? Math.round((completedCount / totalNodes) * 100) : 0;

        // Find next incomplete milestone node
        const nextItem = nodeProgressList.find((item) => item.progress?.status !== "completed");
        if (nextItem) {
          const nextNode = nextItem.node;
          const isStarted = nextItem.progress?.status === "in_progress";
          const score = isStarted ? 550 : 450;

          candidates.push({
            id: `road_${nextNode.nodeId}`,
            category: "roadmap_milestone",
            urgency: "medium",
            compositeScore: score,
            timeProximitySeconds: 86400 * 2,
            severityMagnitude: 20,
            title: `Today's Mission: ${nextNode.title}`,
            subtitle: `${primaryRoadmap.career || "Core Engineering Track"} • Step ${nextNode.sequenceNo} of ${totalNodes}`,
            description: nextNode.description || `Advance your engineering skill path by completing this milestone.`,
            estimatedMinutes: 25,
            xpReward: 50,
            actionUrl: `/roadmap?nodeId=${nextNode.nodeId}`,
            actionLabel: isStarted ? "Resume Mission" : "Start Mission",
            contextBadge: `${primaryRoadmap.career || "Roadmap Track"} (+50 XP)`,
            attachedResource: {
              title: `${nextNode.title} Learning Module`,
              url: `/roadmap?nodeId=${nextNode.nodeId}`,
              type: "Interactive Roadmap Node",
            },
          });
        }
      }

      // Default fallback mission if student has completed everything or no records exist
      if (candidates.length === 0) {
        candidates.push({
          id: "road_default_fresher",
          category: "roadmap_milestone",
          urgency: "low",
          compositeScore: 200,
          timeProximitySeconds: 999999,
          severityMagnitude: 10,
          title: "Today's Mission: Engineering Foundations & Git Setup",
          subtitle: "Kickstart your semester milestone track",
          description: "Initialize your developer environment, terminal configuration, and Git workflow.",
          estimatedMinutes: 25,
          xpReward: 50,
          actionUrl: "/roadmap",
          actionLabel: "Start Mission",
          contextBadge: "Sem 1 Foundation (+50 XP)",
        });
      }

      // -----------------------------------------------------------------------
      // 5. DETERMINISTIC RULE-OF-ONE RESOLUTION
      // -----------------------------------------------------------------------
      candidates.sort((a, b) => this.compareCandidates(a, b));

      const winner = candidates[0];
      const primaryMission: PrimaryMissionDTO = {
        id: winner.id,
        category: winner.category,
        urgency: winner.urgency,
        title: winner.title,
        subtitle: winner.subtitle,
        estimatedMinutes: winner.estimatedMinutes,
        xpReward: winner.xpReward,
        actionUrl: winner.actionUrl,
        actionLabel: winner.actionLabel,
        contextBadge: winner.contextBadge,
        isImpossibleRecovery: winner.isImpossibleRecovery,
        recoveryNote: winner.recoveryNote,
        attachedResource: winner.attachedResource,
      };

      // Urgent Alerts (Critical and High priority items excluding the primary mission winner)
      const urgentAlerts: ActionAlertItemDTO[] = candidates
        .filter((c) => c.id !== winner.id && (c.urgency === "critical" || c.urgency === "high"))
        .map((c) => ({
          id: c.id,
          category: c.category,
          urgency: c.urgency,
          title: c.title,
          description: c.description,
          metricLabel: c.metricLabel || "Priority Score",
          metricValue: c.metricValue || `${c.compositeScore}`,
          actionUrl: c.actionUrl,
          actionLabel: c.actionLabel,
          dueInDays: c.dueInDays,
          dueInHours: c.dueInHours,
          isImpossibleRecovery: c.isImpossibleRecovery,
        }));

      // Secondary Action Timeline
      const actionTimeline: ActionTimelineItemDTO[] = candidates.slice(1, 6).map((c) => ({
        id: c.id,
        category: c.category,
        urgency: c.urgency,
        title: c.title,
        timing:
          c.dueInHours !== undefined && c.dueInHours !== null && c.dueInHours <= 48
            ? `In ${c.dueInHours}h`
            : c.dueInDays !== undefined && c.dueInDays !== null
            ? `In ${c.dueInDays}d`
            : `Next Step`,
        actionUrl: c.actionUrl,
        actionLabel: c.actionLabel,
        badge: c.contextBadge,
      }));

      // Calculate real engagement streak from distinct consecutive activity dates
      let streakDays = 0;
      if (db) {
        const userLogs = await db
          .select({
            attendanceDate: schema.attendanceLogs.attendanceDate,
          })
          .from(schema.attendanceLogs)
          .where(eq(schema.attendanceLogs.userId, userId))
          .orderBy(desc(schema.attendanceLogs.attendanceDate));

        if (userLogs.length > 0) {
          const uniqueDates = Array.from(
            new Set(userLogs.map((l) => l.attendanceDate.split("T")[0]))
          ).sort().reverse();

          if (uniqueDates.length > 0) {
            streakDays = 1;
            for (let i = 0; i < uniqueDates.length - 1; i++) {
              const d1 = new Date(uniqueDates[i]).getTime();
              const d2 = new Date(uniqueDates[i + 1]).getTime();
              const diffDays = Math.round((d1 - d2) / 86400000);
              if (diffDays === 1) {
                streakDays++;
              } else {
                break;
              }
            }
          }
        }
      }

      const radarMetrics: RadarMetricsDTO = {
        overallAttendancePercentage: overallAttendance,
        atRiskCoursesCount,
        totalCoursesCount: attendanceSummaries.length,
        upcomingDeadlinesCount,
        activeRoadmapTitle,
        activeRoadmapProgressPercentage: activeRoadmapProgressPct,
        streakDays,
      };

      const nowIst = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

      return {
        primaryMission,
        urgentAlerts,
        radarMetrics,
        actionTimeline,
        timestampIST: nowIst,
      };
    } catch (error) {
      Logger.error("ActionRadarService.buildRadarPayload failed", error);
      throw error;
    }
  }
}
