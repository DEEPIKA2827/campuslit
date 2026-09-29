/**
 * @file scratch/test_milestone7_action_radar.ts
 * @description Comprehensive automated acceptance test suite for Milestone #7: Action Radar Personalization.
 * Validates 12 deterministic scenarios covering personalized track matching, specialization gateways,
 * in-progress precedence, locked exclusion, unconfigured onboarding, attendance precedence, and user isolation.
 */

import { db, schema } from "../lib/db";
import { eq, and, inArray } from "drizzle-orm";
import { ActionRadarService } from "../services/action-radar.service";
import { roadmapService } from "../services/roadmap.service";

async function runMilestone7Tests() {
  console.log("===============================================================================");
  console.log("       CAMPUSLIT MILESTONE #7: ACTION RADAR PERSONALIZATION TEST SUITE          ");
  console.log("===============================================================================\n");

  const database = db!;
  const actionRadarService = new ActionRadarService();

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, label: string) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${label}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${label}`);
      failedTests++;
    }
  }

  const createdUserIds: number[] = [];

  async function createTestStudent(
    emailSuffix: string,
    careerGoal: string | null,
    branch: string | null = null,
    semester: number | null = 4
  ) {
    const email = `test.m7.${emailSuffix}.${Date.now()}_${Math.random().toString(36).substring(7)}@rvce.edu.in`;
    const [user] = await database
      .insert(schema.users)
      .values({
        email,
        passwordHash: "dummy_hash_for_test",
        role: "student",
      })
      .returning();

    createdUserIds.push(user.userId);

    await database
      .insert(schema.studentProfiles)
      .values({
        userId: user.userId,
        firstName: "Test",
        lastName: "Student",
        collegeId: 1,
        courseId: 1,
        semester,
        careerGoal,
        specializationBranch: branch,
      })
      .returning();

    return user;
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1 — SDE Personalized Roadmap
    // -------------------------------------------------------------------------
    console.log("TEST 1: SDE Personalized Roadmap Candidate");
    const sdeUser = await createTestStudent("sde", "sde");
    const sdeRadar = await actionRadarService.buildRadarPayload(sdeUser.userId);

    assert(
      sdeRadar.primaryMission.category === "roadmap_milestone",
      "SDE student primary mission is roadmap_milestone"
    );
    assert(
      sdeRadar.radarMetrics.activeRoadmapTitle.toLowerCase().includes("software") ||
      sdeRadar.radarMetrics.activeRoadmapTitle.toLowerCase().includes("sde"),
      `SDE student activeRoadmapTitle is SDE track (got: "${sdeRadar.radarMetrics.activeRoadmapTitle}")`
    );

    // Verify candidate is an SDE node, not Core or Higher-Ed
    const sdeRoadmap = await roadmapService.getPersonalizedRoadmapForStudent(sdeUser.userId);
    const firstSdeNode = sdeRoadmap.roadmap?.nodes[0];
    assert(
      sdeRadar.primaryMission.id === `road_${firstSdeNode?.nodeId}`,
      `Primary mission id matches actual SDE first node (road_${firstSdeNode?.nodeId})`
    );
    assert(
      sdeRadar.primaryMission.actionUrl === `/roadmap?nodeId=${firstSdeNode?.nodeId}`,
      `Action URL targets real SDE node (/roadmap?nodeId=${firstSdeNode?.nodeId})`
    );

    // -------------------------------------------------------------------------
    // TEST 2 — Core + NULL Specialization
    // -------------------------------------------------------------------------
    console.log("\nTEST 2: Core + NULL Specialization Gateway");
    const coreNullUser = await createTestStudent("core_null", "core", null);
    const coreNullRadar = await actionRadarService.buildRadarPayload(coreNullUser.userId);

    // Core with null specialization should emit the specialization gateway candidate
    assert(
      coreNullRadar.primaryMission.id.startsWith("road_specialization_gateway_"),
      `Core + NULL emits specialization gateway action as primary mission (got: "${coreNullRadar.primaryMission.id}")`
    );
    assert(
      coreNullRadar.primaryMission.actionUrl === "/roadmap",
      `Specialization gateway actionUrl is "/roadmap"`
    );
    assert(
      coreNullRadar.primaryMission.actionLabel === "Choose Specialization",
      `Specialization gateway actionLabel is "Choose Specialization"`
    );

    // -------------------------------------------------------------------------
    // TEST 3 — Core + Embedded
    // -------------------------------------------------------------------------
    console.log("\nTEST 3: Core + Embedded Specialization");
    const coreEmbUser = await createTestStudent("core_emb", "core", "embedded");
    const coreEmbRadar = await actionRadarService.buildRadarPayload(coreEmbUser.userId);
    const coreEmbRoadmap = await roadmapService.getPersonalizedRoadmapForStudent(coreEmbUser.userId);

    assert(
      Boolean(coreEmbRoadmap.roadmap?.nodes.some((n) => n.nodeKey === "core_08a" || n.nodeKey === "core_09a")),
      "Core + Embedded includes embedded nodes (core_08a / core_09a)"
    );
    assert(
      !coreEmbRoadmap.roadmap?.nodes.some((n) => n.nodeKey.includes("08b") || n.nodeKey.includes("08c")),
      "Core + Embedded strictly excludes IoT (08b) and Robotics (08c) nodes"
    );
    assert(
      coreEmbRadar.primaryMission.category === "roadmap_milestone",
      "Core + Embedded emits roadmap milestone"
    );

    // -------------------------------------------------------------------------
    // TEST 4 — Core + IoT
    // -------------------------------------------------------------------------
    console.log("\nTEST 4: Core + IoT Specialization");
    const coreIotUser = await createTestStudent("core_iot", "core", "iot");
    const coreIotRoadmap = await roadmapService.getPersonalizedRoadmapForStudent(coreIotUser.userId);

    assert(
      Boolean(coreIotRoadmap.roadmap?.nodes.some((n) => n.nodeKey === "core_08b" || n.nodeKey === "core_09b")),
      "Core + IoT includes IoT nodes (core_08b / core_09b)"
    );
    assert(
      !coreIotRoadmap.roadmap?.nodes.some((n) => n.nodeKey.includes("08a") || n.nodeKey.includes("08c")),
      "Core + IoT strictly excludes Embedded (08a) and Robotics (08c) nodes"
    );

    // -------------------------------------------------------------------------
    // TEST 5 — Core + Robotics
    // -------------------------------------------------------------------------
    console.log("\nTEST 5: Core + Robotics Specialization");
    const coreRobUser = await createTestStudent("core_rob", "core", "robotics");
    const coreRobRoadmap = await roadmapService.getPersonalizedRoadmapForStudent(coreRobUser.userId);

    assert(
      Boolean(coreRobRoadmap.roadmap?.nodes.some((n) => n.nodeKey === "core_08c" || n.nodeKey === "core_09c")),
      "Core + Robotics includes Robotics nodes (core_08c / core_09c)"
    );
    assert(
      !coreRobRoadmap.roadmap?.nodes.some((n) => n.nodeKey.includes("08a") || n.nodeKey.includes("08b")),
      "Core + Robotics strictly excludes Embedded (08a) and IoT (08b) nodes"
    );

    // -------------------------------------------------------------------------
    // TEST 6 — Higher Ed Specialization (GATE / MS / MBA)
    // -------------------------------------------------------------------------
    console.log("\nTEST 6: Higher Ed Specialization (GATE vs MS vs MBA)");
    const gateUser = await createTestStudent("higher_gate", "higher_ed", "gate");
    const msUser = await createTestStudent("higher_ms", "higher_ed", "ms");
    const mbaUser = await createTestStudent("higher_mba", "higher_ed", "mba");

    const gateRoadmap = await roadmapService.getPersonalizedRoadmapForStudent(gateUser.userId);
    const msRoadmap = await roadmapService.getPersonalizedRoadmapForStudent(msUser.userId);
    const mbaRoadmap = await roadmapService.getPersonalizedRoadmapForStudent(mbaUser.userId);

    assert(
      Boolean(
        gateRoadmap.roadmap?.nodes.some((n) => n.branch === "gate") &&
        !gateRoadmap.roadmap?.nodes.some((n) => n.branch === "ms" || n.branch === "mba")
      ),
      "GATE student only sees GATE branch milestones without cross-branch leakage"
    );
    assert(
      Boolean(
        msRoadmap.roadmap?.nodes.some((n) => n.branch === "ms") &&
        !msRoadmap.roadmap?.nodes.some((n) => n.branch === "gate" || n.branch === "mba")
      ),
      "MS student only sees MS branch milestones without cross-branch leakage"
    );
    assert(
      Boolean(
        mbaRoadmap.roadmap?.nodes.some((n) => n.branch === "mba") &&
        !mbaRoadmap.roadmap?.nodes.some((n) => n.branch === "gate" || n.branch === "ms")
      ),
      "MBA student only sees MBA branch milestones without cross-branch leakage"
    );

    // -------------------------------------------------------------------------
    // TEST 7 — In-Progress Precedence
    // -------------------------------------------------------------------------
    console.log("\nTEST 7: In-Progress Node Precedence over Unlocked Node");
    const inProgUser = await createTestStudent("inprog", "sde");
    const sdeTrack = await roadmapService.getPersonalizedRoadmapForStudent(inProgUser.userId);
    const sdeNodes = sdeTrack.roadmap!.nodes;

    // Mark first node (sde_01) completed and second node in_progress
    await roadmapService.updateNodeProgress(inProgUser.userId, sdeTrack.roadmap!.id, {
      nodeId: sdeNodes[0].nodeId,
      status: "completed",
    });
    // Now sdeNodes[1] unlocks, mark it in_progress
    await roadmapService.updateNodeProgress(inProgUser.userId, sdeTrack.roadmap!.id, {
      nodeId: sdeNodes[1].nodeId,
      status: "in_progress",
    });

    const inProgRadar = await actionRadarService.buildRadarPayload(inProgUser.userId);
    assert(
      inProgRadar.primaryMission.id === `road_${sdeNodes[1].nodeId}`,
      `Action Radar picks the in_progress node (road_${sdeNodes[1].nodeId})`
    );
    assert(
      inProgRadar.primaryMission.actionLabel === "Resume Mission",
      `In-progress node actionLabel is "Resume Mission"`
    );

    // -------------------------------------------------------------------------
    // TEST 8 — Locked Node Exclusion
    // -------------------------------------------------------------------------
    console.log("\nTEST 8: Locked Node Exclusion (Never Emitted)");
    const lockedUser = await createTestStudent("locked_check", "sde");
    const lockedRadar = await actionRadarService.buildRadarPayload(lockedUser.userId);
    const lockedRoadmap = await roadmapService.getPersonalizedRoadmapForStudent(lockedUser.userId);

    const lockedNodes = lockedRoadmap.roadmap!.nodes.filter((n) => n.status === "locked");
    const allRadarCandidateIds = [
      lockedRadar.primaryMission.id,
      ...lockedRadar.urgentAlerts.map((a) => a.id),
      ...lockedRadar.actionTimeline.map((t) => t.id),
    ];

    const emittedLocked = lockedNodes.some((ln) => allRadarCandidateIds.includes(`road_${ln.nodeId}`));
    assert(
      !emittedLocked,
      `Action Radar strictly excludes all locked nodes (${lockedNodes.length} locked nodes verified absent)`
    );

    // -------------------------------------------------------------------------
    // TEST 9 — Critical Attendance Precedence over Roadmap Milestones
    // -------------------------------------------------------------------------
    console.log("\nTEST 9: Critical Attendance Precedence over Roadmap Milestones");
    const attUser = await createTestStudent("att_risk", "sde");

    // Insert critical attendance (< 75%)
    await database.insert(schema.attendanceSummaries).values({
      userId: attUser.userId,
      courseId: 1,
      totalClasses: 10,
      attendedClasses: 3, // 30% attendance (< 75%)
      attendancePercentage: "30.00",
    });

    const attRadar = await actionRadarService.buildRadarPayload(attUser.userId);
    assert(
      attRadar.primaryMission.category === "attendance_recovery",
      `Critical attendance (<75%) outranks roadmap milestone (category: "${attRadar.primaryMission.category}")`
    );
    assert(
      attRadar.primaryMission.urgency === "critical",
      `Critical attendance urgency is "critical"`
    );

    // -------------------------------------------------------------------------
    // TEST 10 — Unconfigured Student (Direct to Onboarding)
    // -------------------------------------------------------------------------
    console.log("\nTEST 10: Unconfigured Student directs to /onboarding");
    const unconfUser = await createTestStudent("unconf", null); // careerGoal is null
    const unconfRadar = await actionRadarService.buildRadarPayload(unconfUser.userId);

    assert(
      unconfRadar.primaryMission.id === "road_onboarding_profile",
      `Unconfigured student primary mission is road_onboarding_profile (got: "${unconfRadar.primaryMission.id}")`
    );
    assert(
      unconfRadar.primaryMission.actionUrl === "/onboarding",
      `Unconfigured student actionUrl is "/onboarding"`
    );
    assert(
      unconfRadar.primaryMission.actionLabel === "Complete Profile",
      `Unconfigured student actionLabel is "Complete Profile"`
    );
    assert(
      !unconfRadar.primaryMission.id.includes("road_default_fresher"),
      "Obsolete road_default_fresher is strictly NOT emitted"
    );
    assert(
      unconfRadar.radarMetrics.activeRoadmapTitle === "Career Roadmap Not Configured",
      `activeRoadmapTitle is "Career Roadmap Not Configured" (got: "${unconfRadar.radarMetrics.activeRoadmapTitle}")`
    );

    // -------------------------------------------------------------------------
    // TEST 11 — All Roadmap Nodes Completed
    // -------------------------------------------------------------------------
    console.log("\nTEST 11: All Roadmap Nodes Completed");
    const completedUser = await createTestStudent("complete", "founder");
    const founderTrack = await roadmapService.getPersonalizedRoadmapForStudent(completedUser.userId);
    const founderNodes = founderTrack.roadmap!.nodes;

    // Mark all founder nodes completed
    for (const node of founderNodes) {
      await roadmapService.updateNodeProgress(completedUser.userId, founderTrack.roadmap!.id, {
        nodeId: node.nodeId,
        status: "completed",
      });
    }

    const completedRadar = await actionRadarService.buildRadarPayload(completedUser.userId);
    assert(
      completedRadar.primaryMission.id.startsWith("road_completed_"),
      `All nodes completed emits truthful completion candidate (got: "${completedRadar.primaryMission.id}")`
    );
    assert(
      completedRadar.primaryMission.actionLabel === "Review Roadmap",
      `Completed roadmap actionLabel is "Review Roadmap"`
    );
    assert(
      completedRadar.radarMetrics.activeRoadmapProgressPercentage === 100,
      `activeRoadmapProgressPercentage is 100% (got: ${completedRadar.radarMetrics.activeRoadmapProgressPercentage}%)`
    );

    // -------------------------------------------------------------------------
    // TEST 12 — User Isolation (No Cross-User Leakage)
    // -------------------------------------------------------------------------
    console.log("\nTEST 12: User Isolation (Cross-User Integrity)");
    const userA = await createTestStudent("iso_a", "sde");
    const userB = await createTestStudent("iso_b", "sde");

    const trackA = await roadmapService.getPersonalizedRoadmapForStudent(userA.userId);
    // User A completes first 3 nodes
    for (let i = 0; i < 3; i++) {
      await roadmapService.updateNodeProgress(userA.userId, trackA.roadmap!.id, {
        nodeId: trackA.roadmap!.nodes[i].nodeId,
        status: "completed",
      });
    }

    const radarA = await actionRadarService.buildRadarPayload(userA.userId);
    const radarB = await actionRadarService.buildRadarPayload(userB.userId);

    assert(
      radarA.radarMetrics.activeRoadmapProgressPercentage > 0,
      `User A has non-zero progress percentage (${radarA.radarMetrics.activeRoadmapProgressPercentage}%)`
    );
    assert(
      radarB.radarMetrics.activeRoadmapProgressPercentage === 0,
      `User B has 0% progress percentage without cross-user leakage (${radarB.radarMetrics.activeRoadmapProgressPercentage}%)`
    );
    assert(
      radarA.primaryMission.id !== radarB.primaryMission.id,
      `User A and User B have distinct personalized mission IDs (A: ${radarA.primaryMission.id}, B: ${radarB.primaryMission.id})`
    );

    console.log("\n===============================================================================");
    console.log(`🏁 MILESTONE #7 TEST RESULTS: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
    console.log("===============================================================================\n");

    if (failedTests > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error("Test execution encountered an error:", err);
    process.exit(1);
  } finally {
    // Clean up created test students
    if (createdUserIds.length > 0) {
      try {
        await database.delete(schema.users).where(inArray(schema.users.userId, createdUserIds));
      } catch {
        // Ignored
      }
    }
  }
}

runMilestone7Tests().catch((e) => {
  console.error("Fatal error running test suite:", e);
  process.exit(1);
});
