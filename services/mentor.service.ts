/**
 * @file services/mentor.service.ts
 * @description Business orchestration layer for CampusOS AI Senior Mentor.
 * @purpose Gathers verified student context, builds strict system instructions, manages bounded history, and orchestrates LLM completion.
 */

import { ILLMProvider, LLMMessage, xaiProvider } from "@/services/llm-provider.service";
import { roadmapService, RoadmapService } from "@/services/roadmap.service";
import { ActionRadarService } from "@/services/action-radar.service";
import { userRepository, UserRepository } from "@/repositories/user.repository";
import { academicRepository, AcademicRepository } from "@/repositories/academic.repository";
import { attendanceRepository, AttendanceRepository } from "@/repositories/attendance.repository";
import { attendanceService, AttendanceService } from "@/services/attendance.service";
import { assessmentRepository, AssessmentRepository } from "@/repositories/assessment.repository";
import { scholarshipRepository, ScholarshipRepository } from "@/repositories/scholarship.repository";
import { opportunityRepository, OpportunityRepository } from "@/repositories/opportunity.repository";
import { chatRepository, ChatRepository } from "@/repositories/chat.repository";
import { Logger } from "@/lib/logger";

/**
 * Exact conversation history limit (number of recent messages included in LLM context).
 */
export const MENTOR_CONVERSATION_HISTORY_LIMIT = 10;

export interface MentorContextData {
  student: {
    name?: string;
    semester?: number | null;
    courseName?: string | null;
    careerGoal?: string | null;
    specializationBranch?: string | null;
    programmingLevel?: string | null;
    technicalInterests?: string[] | null;
    targetSgpa?: number | null;
    evaluationScheme?: string | null;
  };
  roadmap: {
    configured: boolean;
    title?: string;
    careerSlug?: string;
    progressPercentage?: number;
    completedCount?: number;
    totalNodes?: number;
    inProgressNode?: { nodeKey: string; title: string; targetSemester?: number | null } | null;
    nextUnlockedNode?: { nodeKey: string; title: string; targetSemester?: number | null } | null;
    requiresSpecializationSelection?: boolean;
    specializationBranch?: string | null;
  };
  actionRadar: {
    primaryMission: string;
    primaryCategory: string;
    urgency: string;
    alertsSummary: string[];
  };
  academics: {
    overallAttendancePercentage?: number;
    atRiskCoursesCount?: number;
    courses: Array<{
      courseName: string;
      courseCode: string;
      attended: number;
      total: number;
      percentage: number;
      status: "at_risk" | "safe";
      recoveryClassesNeeded?: number;
      safeBunksAvailable?: number;
    }>;
    recentCieMarks: Array<{
      courseName: string;
      assessmentName: string;
      marksObtained: number;
      maxMarks: number;
    }>;
  };
  career: {
    bookmarkedScholarships: Array<{ title: string; deadline?: string | null }>;
    trackedOpportunities: Array<{ title: string; company?: string; status?: string }>;
  };
}

export class MentorService {
  private actionRadarSvc: ActionRadarService;

  constructor(
    private llmProvider: ILLMProvider = xaiProvider,
    private roadmapSvc: RoadmapService = roadmapService,
    actionRadarSvc?: ActionRadarService,
    private userRepo: UserRepository = userRepository,
    private academicRepo: AcademicRepository = academicRepository,
    private attendanceRepo: AttendanceRepository = attendanceRepository,
    private assessmentRepo: AssessmentRepository = assessmentRepository,
    private scholarshipRepo: ScholarshipRepository = scholarshipRepository,
    private opportunityRepo: OpportunityRepository = opportunityRepository,
    private chatRepo: ChatRepository = chatRepository,
    private attendanceSvc: AttendanceService = attendanceService
  ) {
    this.actionRadarSvc = actionRadarSvc || new ActionRadarService();
  }

  /**
   * Assembles verified CampusOS context for the authenticated student.
   * Never fabricates missing data; reports factual state as-is.
   */
  public async buildStudentContext(userId: number): Promise<MentorContextData> {
    Logger.debug("MentorService.buildStudentContext", { userId });

    // 1. Profile & Student State
    const profile = await this.userRepo.getProfile(userId);
    let courseName: string | null = null;
    if (profile?.courseId) {
      const course = await this.academicRepo.getCourseById(profile.courseId);
      if (course) {
        courseName = course.courseCode
          ? `${course.courseName} (${course.courseCode})`
          : course.courseName;
      }
    }

    // 2. Authoritative Deterministic Personalized Roadmap
    const roadmapRes = await this.roadmapSvc.getPersonalizedRoadmapForStudent(userId);
    const roadmap = roadmapRes.roadmap;
    const inProgressNode = roadmap?.nodes?.find((n) => n.status === "in_progress") ?? null;
    const nextUnlockedNode = roadmap?.nodes?.find((n) => n.status === "unlocked") ?? null;

    // 3. Authoritative Action Radar Engine
    const radar = await this.actionRadarSvc.buildRadarPayload(userId);

    // 4. Attendance & Academic Assessment Details (Delegated to Authoritative Domain Calculation)
    const attendanceSummaries = await this.attendanceRepo.getSummariesWithCourseDetails(userId);
    const parsedAttendanceCourses = attendanceSummaries.map((s) => {
      const attended = s.attendedClasses || 0;
      const total = s.totalClasses || 0;

      // Delegate directly to authoritative AttendanceService domain calculation
      const bunkDefense = this.attendanceSvc.calculateBunkDefense(total, attended);
      const isAtRisk = bunkDefense.classesNeededFor75 > 0;

      return {
        courseName: s.courseName,
        courseCode: s.courseCode || `CS${s.courseId}`,
        attended,
        total,
        percentage: bunkDefense.attendancePercentage,
        status: isAtRisk ? ("at_risk" as const) : ("safe" as const),
        recoveryClassesNeeded: isAtRisk ? bunkDefense.classesNeededFor75 : undefined,
        safeBunksAvailable: !isAtRisk ? bunkDefense.safeBunksAvailable : undefined,
      };
    });

    const marksRecords = await this.assessmentRepo.getAllStudentMarksWithDetails(userId);
    const parsedMarks = (marksRecords || []).slice(0, 5).map((m: any) => ({
      courseName: m.courseName || `Course #${m.courseId}`,
      assessmentName: m.assessmentName || "Internal Assessment",
      marksObtained: Number(m.marksObtained) || 0,
      maxMarks: Number(m.maxMarks) || 50,
    }));

    // 5. Tracked Opportunities & Bookmarked Scholarships
    const opps = await this.opportunityRepo.getStudentOpportunities(userId);
    const scholarships = await this.scholarshipRepo.getUserBookmarkedScholarships(userId);

    const alertsSummary = (radar.urgentAlerts || [])
      .slice(0, 3)
      .map((i) => `[${i.urgency.toUpperCase()}] ${i.title}: ${i.description}`);

    return {
      student: {
        name: profile?.firstName || undefined,
        semester: profile?.semester,
        courseName,
        careerGoal: profile?.careerGoal,
        specializationBranch: profile?.specializationBranch,
        programmingLevel: profile?.programmingLevel,
        technicalInterests: profile?.technicalInterests,
        targetSgpa: profile?.targetSgpa,
        evaluationScheme: profile?.evaluationScheme,
      },
      roadmap: {
        configured: roadmapRes.configured,
        title: roadmap?.title,
        careerSlug: roadmap?.careerSlug,
        progressPercentage: roadmap?.progressPercentage,
        completedCount: roadmap?.completedNodes,
        totalNodes: roadmap?.totalNodes,
        inProgressNode: inProgressNode
          ? {
              nodeKey: inProgressNode.nodeKey,
              title: inProgressNode.title,
              targetSemester: inProgressNode.targetSemester,
            }
          : null,
        nextUnlockedNode: nextUnlockedNode
          ? {
              nodeKey: nextUnlockedNode.nodeKey,
              title: nextUnlockedNode.title,
              targetSemester: nextUnlockedNode.targetSemester,
            }
          : null,
        requiresSpecializationSelection: roadmap?.requiresSpecializationSelection,
        specializationBranch: roadmapRes.studentContext?.specializationBranch ?? null,
      },
      actionRadar: {
        primaryMission: radar.primaryMission.title,
        primaryCategory: radar.primaryMission.category,
        urgency: radar.primaryMission.urgency,
        alertsSummary,
      },
      academics: {
        overallAttendancePercentage: radar.radarMetrics.overallAttendancePercentage,
        atRiskCoursesCount: radar.radarMetrics.atRiskCoursesCount,
        courses: parsedAttendanceCourses,
        recentCieMarks: parsedMarks,
      },
      career: {
        bookmarkedScholarships: (scholarships || []).slice(0, 3).map((s: any) => ({
          title: s.scholarshipName || s.title || "Scholarship",
          deadline: s.deadlineDate ? String(s.deadlineDate).split("T")[0] : null,
        })),
        trackedOpportunities: (opps || []).slice(0, 3).map((o: any) => ({
          title: o.title || "Opportunity",
          company: o.companyName || o.company,
          status: o.status,
        })),
      },
    };
  }

  /**
   * Constructs strict, authoritative system instruction for the AI Senior Mentor.
   */
  public buildSystemPrompt(context: MentorContextData): string {
    const s = context.student;
    const r = context.roadmap;
    const ar = context.actionRadar;
    const ac = context.academics;
    const cr = context.career;

    return `You are the CampusOS AI Mentor, a senior engineering mentor for the student using CampusOS.

=== AUTHORITATIVE CAMPUSOS STUDENT STATE ===
STUDENT PROFILE:
- Name: ${s.name || "Student"}
- Semester: ${s.semester ?? "Not specified"}
- Branch/Course: ${s.courseName ?? "Engineering"}
- Career Goal: ${s.careerGoal ?? "Not configured"}
- Specialization Branch: ${s.specializationBranch ?? "None selected"}
- Programming Level: ${s.programmingLevel ?? "Not specified"}
- Technical Interests: ${s.technicalInterests?.length ? s.technicalInterests.join(", ") : "None specified"}
- Target SGPA: ${s.targetSgpa ?? "Not set"}
- Evaluation Scheme: ${s.evaluationScheme ?? "VTU / Autonomous"}

ROADMAP ENGINE STATUS:
- Configured: ${r.configured ? "Yes" : "No"}
- Track: ${r.title ?? "None"} (${r.careerSlug ?? "none"})
- Progress: ${r.progressPercentage ?? 0}% (${r.completedCount ?? 0}/${r.totalNodes ?? 0} milestones)
- In-Progress Node: ${r.inProgressNode ? `${r.inProgressNode.title} (Sem ${r.inProgressNode.targetSemester})` : "None"}
- Next Unlocked Node: ${r.nextUnlockedNode ? `${r.nextUnlockedNode.title} (Sem ${r.nextUnlockedNode.targetSemester})` : "None"}
- Specialization Selection Required: ${r.requiresSpecializationSelection ? "YES (branch must be chosen to unlock capstone)" : "No"}

ACTION RADAR MISSION:
- Primary Mission: "${ar.primaryMission}"
- Primary Category: ${ar.primaryCategory}
- Urgency: ${ar.urgency}
${ar.alertsSummary.length > 0 ? `- Urgent Items:\n  * ${ar.alertsSummary.join("\n  * ")}` : "- No urgent alerts."}

ACADEMIC METRICS:
- Overall Attendance: ${ac.overallAttendancePercentage ?? 100}%
- At-Risk Courses (<75%): ${ac.atRiskCoursesCount ?? 0}
${
  ac.courses.length > 0
    ? `- Courses:\n  * ` +
      ac.courses
        .map(
          (c) =>
            `${c.courseName} (${c.courseCode}): ${c.percentage}% [${c.status.toUpperCase()}]` +
            (c.recoveryClassesNeeded ? ` -> Need ${c.recoveryClassesNeeded} consecutive classes to reach 75%` : "") +
            (c.safeBunksAvailable !== undefined ? ` -> ${c.safeBunksAvailable} safe bunk(s) available` : "")
        )
        .join("\n  * ")
    : "- No course attendance records logged yet."
}
${
  ac.recentCieMarks.length > 0
    ? `- Recent Assessments:\n  * ` +
      ac.recentCieMarks.map((m) => `${m.courseName} - ${m.assessmentName}: ${m.marksObtained}/${m.maxMarks}`).join("\n  * ")
    : "- No CIE assessment marks recorded yet."
}

CAREER & OPPORTUNITIES:
${
  cr.bookmarkedScholarships.length > 0
    ? `- Bookmarked Scholarships:\n  * ` +
      cr.bookmarkedScholarships.map((b) => `${b.title} (Deadline: ${b.deadline || "Open"})`).join("\n  * ")
    : "- No scholarships bookmarked."
}
${
  cr.trackedOpportunities.length > 0
    ? `- Tracked Opportunities:\n  * ` +
      cr.trackedOpportunities.map((o) => `${o.title}${o.company ? ` at ${o.company}` : ""} [${o.status || "active"}]`).join("\n  * ")
    : "- No opportunities tracked."
}

=== STRICT SYSTEM INSTRUCTIONS & BEHAVIORAL CONTRACT ===
1. AUTHORITATIVE CONTEXT: The CampusOS context supplied above is the sole factual source of truth for the student's academic and career standing. Treat it as authoritative fact.
2. NEVER FABRICATE: Never invent attendance numbers, marks, roadmap completion, deadlines, eligibility criteria, opportunities, or scholarships. If specific information is not in the context, explicitly say that it is not available in CampusOS.
3. NO FABRICATED DATABASE ACTIONS: You cannot modify databases, update attendance, register for courses, or submit applications. Never claim that you changed anything in CampusOS.
4. PRIORITIZATION RULE: When the student asks "what should I do next?" or "what should I focus on?", prioritize the existing Action Radar primary mission and the next unlocked roadmap milestone. Do not invent an unrelated priority.
5. ADAPTIVE GUIDANCE: Adapt your technical depth and explanations to the student's semester (${s.semester ?? 1}), career goal (${s.careerGoal ?? "General"}), and programming level (${s.programmingLevel ?? "Intermediate"}).
6. FACT VS. ADVICE: Clearly distinguish factual CampusOS records (e.g., attendance percentages, locked milestones) from your pedagogical advice, study strategies, and code explanations.
7. YOUR ROLE: You are an encouraging, pragmatic senior engineering mentor. Teach concepts clearly, suggest efficient study plans, help debug code, explain viva questions, and prepare the student for engineering success.`;
  }

  /**
   * Orchestrates the AI Mentor conversation:
   * 1. Fetches verified student context.
   * 2. Builds system prompt.
   * 3. Fetches bounded chronological history from chat_messages.
   * 4. Assembles messages array.
   * 5. Calls ILLMProvider.
   * 6. Returns assistant response string.
   */
  public async generateMentorResponse(
    userId: number,
    chatId: number,
    currentMessage: string
  ): Promise<string> {
    Logger.info("MentorService.generateMentorResponse", { userId, chatId });

    // 1. Obtain verified CampusOS context
    const context = await this.buildStudentContext(userId);
    const systemPrompt = this.buildSystemPrompt(context);

    // 2. Fetch bounded conversation history (most recent messages)
    const recentMessages = await this.chatRepo.getMessagesByThread(
      chatId,
      userId,
      MENTOR_CONVERSATION_HISTORY_LIMIT,
      0
    );

    // 3. Build chronological LLM messages array
    const llmMessages: LLMMessage[] = [
      {
        role: "system",
        content: systemPrompt,
      },
    ];

    // Map history messages
    for (const msg of recentMessages) {
      llmMessages.push({
        role: msg.senderType === "assistant" ? "assistant" : "user",
        content: msg.message,
      });
    }

    // Ensure the current user message is present at the end
    const lastMsg = llmMessages[llmMessages.length - 1];
    if (!lastMsg || lastMsg.role !== "user" || lastMsg.content !== currentMessage) {
      llmMessages.push({
        role: "user",
        content: currentMessage,
      });
    }

    // 4. Invoke LLM provider with safe server-side completion options
    const assistantResponse = await this.llmProvider.generateText(llmMessages, {
      temperature: 0.3,
      maxTokens: 1024,
      timeoutMs: 25000,
    });

    return assistantResponse;
  }
}

export const mentorService = new MentorService();
