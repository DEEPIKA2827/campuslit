/**
 * @file db/seed.ts
 * @description Master Seed Script for CampusOS.
 * @purpose Populates the database with realistic, authentic catalog data across all 21 tables using the Ingestion Engine.
 * @order Strictly respects topological dependency order (Level 0 through Level 4).
 */

import { db, schema } from "@/lib/db";
import { Logger } from "@/lib/logger";
import { eq, gt } from "drizzle-orm";
import { CatalogIngestionEngine } from "@/lib/ingestion";
import karnatakaCollegesData from "@/data/karnataka_engineering_colleges.json";

export async function runSeed(): Promise<void> {
  if (!db) {
    throw new Error(
      "Cannot run database seed: Database client is not initialized. Please ensure DATABASE_URL is properly configured in your environment."
    );
  }

  Logger.info("Starting CampusOS Master Seed Pipeline across 21 tables via CatalogIngestionEngine...");

  try {
    // =========================================================================
    // LEVEL 0: Root Master Tables (0 Foreign Keys)
    // =========================================================================
    Logger.info("Seeding Level 0: Master Tables (users, colleges, scholarships, roadmaps, opportunities)...");

    // 1. Users (5 Core Demo Users)
    const seededUsers = await db
      .insert(schema.users)
      .values([
        {
          email: "admin@campusos.demo",
          passwordHash: "$2a$12$demo_admin_hash_for_testing_purposes_only",
          role: "admin",
        },
        {
          email: "faculty.sharma@campusos.demo",
          passwordHash: "$2a$12$demo_faculty_hash_for_testing_purposes_only",
          role: "faculty",
        },
        {
          email: "test.primary@campusos.internal",
          passwordHash: "$2a$12$demo_student_hash_for_testing_purposes_only",
          role: "student",
        },
        {
          email: "student.ananya@campusos.demo",
          passwordHash: "$2a$12$demo_student_hash_for_testing_purposes_only",
          role: "student",
        },
        {
          email: "student.vikram@campusos.demo",
          passwordHash: "$2a$12$demo_student_hash_for_testing_purposes_only",
          role: "student",
        },
      ])
      .onConflictDoNothing()
      .returning();

    // 2. Colleges (Canonical Dataset of 192 Verified Karnataka Engineering Institutions)
    const existingColleges = await db.select().from(schema.colleges);

    for (let i = 0; i < karnatakaCollegesData.length; i++) {
      const c = karnatakaCollegesData[i];
      const existing = existingColleges.find((ex) => ex.collegeId === c.collegeId);
      if (existing) {
        await db
          .update(schema.colleges)
          .set({
            collegeName: c.collegeName,
            location: `${c.location} • ${c.affiliation} • ${c.type}`,
          })
          .where(eq(schema.colleges.collegeId, c.collegeId));
      } else {
        await db.insert(schema.colleges).values({
          collegeName: c.collegeName,
          location: `${c.location} • ${c.affiliation} • ${c.type}`,
        });
      }
    }

    // Clean up any extraneous rows beyond the 192 canonical institutions
    await db
      .delete(schema.colleges)
      .where(gt(schema.colleges.collegeId, 192));

    const seededColleges = await db.select().from(schema.colleges);

    // 3. Scholarships (Ingested via CatalogIngestionEngine)
    const scholarshipValidation = CatalogIngestionEngine.loadScholarships();
    const existingScholarships = await db
      .select({ id: schema.scholarships.scholarshipId, name: schema.scholarships.scholarshipName })
      .from(schema.scholarships);
    const existingSchMap = new Map(
      existingScholarships.map((s) => [s.name.toLowerCase().trim(), s.id])
    );

    for (const s of scholarshipValidation.validRecords) {
      const formattedDesc = `${s.provider} • Source: ${s.source} • Category: ${s.category} • Amount: ${s.grantAmount} • Verified: ${s.lastVerifiedAt} [${s.verificationStatus}]`;
      const formattedElig = `${s.eligibility} • Criteria: ${s.academicCriteria}${s.maxIncome ? ` • Income: ${s.maxIncome}` : ""}`;

      const existingId = existingSchMap.get(s.scholarshipName.toLowerCase().trim());
      if (existingId) {
        await db
          .update(schema.scholarships)
          .set({
            description: formattedDesc,
            eligibility: formattedElig,
            applicationUrl: s.applicationUrl,
            deadline: s.deadline,
          })
          .where(eq(schema.scholarships.scholarshipId, existingId));
      } else {
        await db.insert(schema.scholarships).values({
          scholarshipName: s.scholarshipName,
          description: formattedDesc,
          eligibility: formattedElig,
          applicationUrl: s.applicationUrl,
          deadline: s.deadline,
        });
      }
    }

    const seededScholarships = await db.select().from(schema.scholarships);

    // 4. Roadmaps (3 Demo Career Roadmaps)
    const seededRoadmaps = await db
      .insert(schema.roadmaps)
      .values([
        {
          title: "Full-Stack Web Developer Roadmap",
          description: "Step-by-step curriculum for modern web engineering (TypeScript, React, Next.js, Node.js, PostgreSQL).",
          career: "Full Stack Engineer",
        },
        {
          title: "AI & Machine Learning Engineer Roadmap",
          description: "Foundations of linear algebra, python data stack, deep learning, PyTorch, and LLM application development.",
          career: "AI / ML Engineer",
        },
        {
          title: "Cloud Native & DevOps Engineer Roadmap",
          description: "Linux systems, Docker containerization, Kubernetes orchestration, CI/CD pipelines, and cloud platforms.",
          career: "DevOps Engineer",
        },
      ])
      .onConflictDoNothing()
      .returning();

    // 5. Opportunities (Ingested via CatalogIngestionEngine)
    const opportunityValidation = CatalogIngestionEngine.loadOpportunities();
    const existingOpportunities = await db
      .select({ id: schema.opportunities.opportunityId, title: schema.opportunities.title })
      .from(schema.opportunities);
    const existingOppMap = new Map(
      existingOpportunities.map((o) => [o.title.toLowerCase().trim(), o.id])
    );

    for (const o of opportunityValidation.validRecords) {
      const formattedDesc = `${o.description} • Source: ${o.source} • Category: ${o.category} • Mode: ${o.workMode} • Stipend: ${o.stipend} • Tags: ${o.tags.join(", ")} • Batch: ${o.batch.join(", ")} • Verified: ${o.lastVerifiedAt}`;

      const existingId = existingOppMap.get(o.title.toLowerCase().trim());
      if (existingId) {
        await db
          .update(schema.opportunities)
          .set({
            company: o.company,
            description: formattedDesc,
            applicationUrl: o.applicationUrl,
            deadline: o.deadline,
          })
          .where(eq(schema.opportunities.opportunityId, existingId));
      } else {
        await db.insert(schema.opportunities).values({
          title: o.title,
          company: o.company,
          description: formattedDesc,
          applicationUrl: o.applicationUrl,
          deadline: o.deadline,
        });
      }
    }

    const seededOpportunities = await db.select().from(schema.opportunities);

    // Fetch master records
    const allUsers = seededUsers.length > 0 ? seededUsers : await db.select().from(schema.users);
    const allColleges = seededColleges.length > 0 ? seededColleges : await db.select().from(schema.colleges);
    const allScholarships = seededScholarships;
    const allRoadmaps = seededRoadmaps.length > 0 ? seededRoadmaps : await db.select().from(schema.roadmaps);
    const allOpportunities = seededOpportunities;

    // =========================================================================
    // LEVEL 1: First-Tier Dependencies
    // =========================================================================
    Logger.info("Seeding Level 1: Academic Schemes, Settings, Chat Threads, Roadmap Nodes, Bookmarks...");

    // 6. Academic Schemes (Linked to Colleges)
    const seededSchemes = await db
      .insert(schema.academicSchemes)
      .values([
        {
          collegeId: allColleges[0].collegeId,
          schemeName: "VTU 2022 Scheme (Autonomous Framework)",
          academicYear: "2022-2026",
        },
        {
          collegeId: allColleges[1].collegeId,
          schemeName: "BMSCE Autonomous Curriculum 2023",
          academicYear: "2023-2027",
        },
      ])
      .onConflictDoNothing()
      .returning();

    const allSchemes = seededSchemes.length > 0 ? seededSchemes : await db.select().from(schema.academicSchemes);

    // 7. Student Settings (Linked to Users)
    for (const u of allUsers) {
      await db
        .insert(schema.studentSettings)
        .values({
          userId: u.userId,
          notificationEnabled: true,
          theme: "system",
          language: "en",
        })
        .onConflictDoNothing();
    }

    // 8. Chat Threads (Linked to Users)
    const studentUser = allUsers.find((u) => u.role === "student") || allUsers[0];
    const seededThreads = await db
      .insert(schema.chatThreads)
      .values([
        {
          userId: studentUser.userId,
          title: "Exam Preparation Strategy for VTU DBMS",
        },
        {
          userId: studentUser.userId,
          title: "Data Structures & Algorithms Roadmap Doubts",
        },
      ])
      .onConflictDoNothing()
      .returning();

    const allThreads = seededThreads.length > 0 ? seededThreads : await db.select().from(schema.chatThreads);

    // 9. Roadmap Nodes (Linked to Roadmaps)
    const webRoadmap = allRoadmaps[0];
    const seededNodes = await db
      .insert(schema.roadmapNodes)
      .values([
        { roadmapId: webRoadmap.roadmapId, sequenceNo: 1, title: "Internet & HTTP Fundamentals", description: "DNS, TCP/IP, HTTP/HTTPS methods, headers, and request lifecycle." },
        { roadmapId: webRoadmap.roadmapId, sequenceNo: 2, title: "Modern HTML5 & Semantic Elements", description: "Accessibility, SEO best practices, and document structure." },
        { roadmapId: webRoadmap.roadmapId, sequenceNo: 3, title: "CSS3, Flexbox & Responsive Layouts", description: "Grid, Flexbox, CSS Variables, and Mobile-First responsive styling." },
        { roadmapId: webRoadmap.roadmapId, sequenceNo: 4, title: "JavaScript & TypeScript Mastery", description: "Async/await, closures, prototypes, TypeScript interfaces and types." },
        { roadmapId: webRoadmap.roadmapId, sequenceNo: 5, title: "React & Next.js Architecture", description: "Hooks, server components, routing, data fetching, and state management." },
        { roadmapId: webRoadmap.roadmapId, sequenceNo: 6, title: "Relational Databases & Drizzle ORM", description: "PostgreSQL schema design, normalization, indexing, and migrations." },
      ])
      .onConflictDoNothing()
      .returning();

    const allNodes = seededNodes.length > 0 ? seededNodes : await db.select().from(schema.roadmapNodes);

    // 10. Student Scholarship Bookmarks
    if (allScholarships.length > 0) {
      await db
        .insert(schema.studentScholarshipBookmarks)
        .values([
          { userId: studentUser.userId, scholarshipId: allScholarships[0].scholarshipId },
          { userId: studentUser.userId, scholarshipId: allScholarships[1].scholarshipId },
        ])
        .onConflictDoNothing();
    }

    // 11. Student Opportunities Tracking
    if (allOpportunities.length > 0) {
      await db
        .insert(schema.studentOpportunities)
        .values([
          { userId: studentUser.userId, opportunityId: allOpportunities[0].opportunityId, status: "applied" },
          { userId: studentUser.userId, opportunityId: allOpportunities[1].opportunityId, status: "saved" },
        ])
        .onConflictDoNothing();
    }

    // =========================================================================
    // LEVEL 2: Second-Tier Dependencies
    // =========================================================================
    Logger.info("Seeding Level 2: Courses, Chat Messages, Student Roadmap Progress...");

    // 12. Courses (Synchronized from Ingested Academic Resource Vault)
    const academicVaultValidation = CatalogIngestionEngine.loadAcademicResources();
    const existingCourses = await db.select().from(schema.courses);
    const existingCourseMap = new Map(existingCourses.map((c) => [c.courseCode?.toUpperCase() || "", c]));

    for (const cv of academicVaultValidation.validRecords) {
      if (!existingCourseMap.has(cv.courseCode.toUpperCase())) {
        await db
          .insert(schema.courses)
          .values({
            schemeId: allSchemes[0].schemeId,
            courseName: cv.courseName,
            courseCode: cv.courseCode,
          })
          .onConflictDoNothing();
      }
    }

    const allCourses = await db.select().from(schema.courses);

    // 13. Chat Messages (Linked to Chat Threads)
    if (allThreads.length > 0) {
      await db
        .insert(schema.chatMessages)
        .values([
          {
            chatId: allThreads[0].chatId,
            senderType: "user",
            message: "How should I structure my study plan for VTU 21CS42 DBMS Module 2 (SQL & Normalization)?",
          },
          {
            chatId: allThreads[0].chatId,
            senderType: "assistant",
            message: "For Module 2, focus on: 1. Functional Dependencies and 2NF/3NF/BCNF decomposition rules. 2. Practical SQL DDL/DML queries with JOINs and aggregate functions. 3. Reviewing previous year questions on lossless join decomposition.",
          },
        ])
        .onConflictDoNothing();
    }

    // 14. Student Roadmap Progress
    if (allNodes.length >= 2) {
      await db
        .insert(schema.studentRoadmapProgress)
        .values([
          {
            userId: studentUser.userId,
            roadmapId: webRoadmap.roadmapId,
            nodeId: allNodes[0].nodeId,
            status: "completed",
            completedAt: new Date().toISOString(),
          },
          {
            userId: studentUser.userId,
            roadmapId: webRoadmap.roadmapId,
            nodeId: allNodes[1].nodeId,
            status: "in_progress",
          },
        ])
        .onConflictDoNothing();
    }

    // =========================================================================
    // LEVEL 3: Third-Tier Dependencies (Profiles, Logs, Summaries, Assessments)
    // =========================================================================
    Logger.info("Seeding Level 3: Student Profiles, Attendance Logs/Summaries, CIE Assessments, Question Banks...");

    // 15. Student Profiles (Linked to users, colleges, courses)
    const studentUsers = allUsers.filter((u) => u.role === "student");
    const demoProfiles = [
      {
        userId: studentUsers[0]?.userId || allUsers[2].userId,
        firstName: "Rahul",
        lastName: "Sharma",
        collegeId: allColleges[0].collegeId,
        courseId: allCourses[0].courseId,
        semester: 4,
      },
      {
        userId: studentUsers[1]?.userId || allUsers[3].userId,
        firstName: "Ananya",
        lastName: "Rao",
        collegeId: allColleges[0].collegeId,
        courseId: allCourses[1].courseId,
        semester: 4,
      },
      {
        userId: studentUsers[2]?.userId || allUsers[4].userId,
        firstName: "Vikram",
        lastName: "Patil",
        collegeId: allColleges[1].collegeId,
        courseId: allCourses[2].courseId,
        semester: 6,
      },
    ];

    for (const p of demoProfiles) {
      await db.insert(schema.studentProfiles).values(p).onConflictDoNothing();
    }

    // 16. Attendance Logs (Daily entries)
    const primaryStudent = demoProfiles[0].userId;
    const dbmsCourse = allCourses[1]?.courseId || allCourses[0].courseId;

    await db
      .insert(schema.attendanceLogs)
      .values([
        { userId: primaryStudent, courseId: dbmsCourse, attendanceDate: "2026-08-01", status: "present" },
        { userId: primaryStudent, courseId: dbmsCourse, attendanceDate: "2026-08-03", status: "present" },
        { userId: primaryStudent, courseId: dbmsCourse, attendanceDate: "2026-08-05", status: "absent" },
        { userId: primaryStudent, courseId: dbmsCourse, attendanceDate: "2026-08-08", status: "present" },
        { userId: primaryStudent, courseId: dbmsCourse, attendanceDate: "2026-08-10", status: "present" },
      ])
      .onConflictDoNothing();

    // 17. Attendance Summaries
    await db
      .insert(schema.attendanceSummaries)
      .values([
        {
          userId: primaryStudent,
          courseId: dbmsCourse,
          totalClasses: 25,
          attendedClasses: 22,
          attendancePercentage: "88.00",
        },
        {
          userId: primaryStudent,
          courseId: allCourses[0].courseId,
          totalClasses: 30,
          attendedClasses: 24,
          attendancePercentage: "80.00",
        },
      ])
      .onConflictDoNothing();

    // 18. CIE Assessments
    const seededCie = await db
      .insert(schema.cieAssessments)
      .values([
        { courseId: dbmsCourse, assessmentName: "Continuous Internal Evaluation (CIE-1)", assessmentDate: "2026-09-10", maxMarks: "50.00" },
        { courseId: dbmsCourse, assessmentName: "Continuous Internal Evaluation (CIE-2)", assessmentDate: "2026-11-05", maxMarks: "50.00" },
        { courseId: dbmsCourse, assessmentName: "Database Laboratory Practical Exam", assessmentDate: "2026-11-20", maxMarks: "25.00" },
      ])
      .onConflictDoNothing()
      .returning();

    const allCie = seededCie.length > 0 ? seededCie : await db.select().from(schema.cieAssessments);

    // 19. PYQs (Previous-Year Questions from canonical resources)
    const pyqValues = [];

    for (const courseData of academicVaultValidation.validRecords) {
      const matchCourse = allCourses.find(
        (c) => c.courseCode?.toUpperCase() === courseData.courseCode.toUpperCase() ||
               c.courseName.toLowerCase() === courseData.courseName.toLowerCase()
      ) || allCourses[0];

      for (const hfq of courseData.highFrequencyQuestions) {
        pyqValues.push({
          courseId: matchCourse.courseId,
          question: hfq.question,
          examYear: 2024,
          marks: hfq.typicalMarks.toFixed(2),
          difficulty: hfq.frequencyRatio >= 0.8 ? ("hard" as const) : ("medium" as const),
        });
      }
    }

    if (pyqValues.length > 0) {
      await db.insert(schema.pyqs).values(pyqValues).onConflictDoNothing();
    }

    // 20. Viva Questions (from canonical resources)
    const vivaValues = [];

    for (const courseData of academicVaultValidation.validRecords) {
      const matchCourse = allCourses.find(
        (c) => c.courseCode?.toUpperCase() === courseData.courseCode.toUpperCase() ||
               c.courseName.toLowerCase() === courseData.courseName.toLowerCase()
      ) || allCourses[0];

      for (const v of courseData.vivaQuestions) {
        vivaValues.push({
          courseId: matchCourse.courseId,
          question: v.question,
          difficulty: v.difficulty as "easy" | "medium" | "hard",
        });
      }
    }

    if (vivaValues.length > 0) {
      await db.insert(schema.vivaQuestions).values(vivaValues).onConflictDoNothing();
    }

    // =========================================================================
    // LEVEL 4: Fourth-Tier Dependencies (CIE Marks)
    // =========================================================================
    Logger.info("Seeding Level 4: Student CIE Marks...");

    // 21. Student CIE Marks
    if (allCie.length > 0) {
      await db
        .insert(schema.studentCieMarks)
        .values([
          {
            userId: primaryStudent,
            cieId: allCie[0].cieId,
            marksObtained: "44.50",
          },
          {
            userId: primaryStudent,
            cieId: allCie[2].cieId,
            marksObtained: "23.00",
          },
        ])
        .onConflictDoNothing();
    }

    Logger.info("✅ CampusOS Master Seed Pipeline completed successfully across all 21 tables!");
  } catch (error) {
    Logger.error("Failed during Master Seed Pipeline execution", error);
    throw error;
  }
}
