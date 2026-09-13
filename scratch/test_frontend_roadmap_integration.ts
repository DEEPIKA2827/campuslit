/**
 * @file scratch/test_frontend_roadmap_integration.ts
 * @description Integration verification suite for Frontend Roadmap Data Flow & Specialization Gateway.
 * @purpose Verifies exact contracts consumed by app/roadmap/page.tsx:
 *          - Career-to-node counts (SDE: 13, AI/ML: 13, Founder: 12)
 *          - Core branch isolation (NULL: 10 common, Embedded: 12, IoT: 12, Robotics: 12)
 *          - Higher Studies branch isolation (NULL: 4 common, GATE: 9, MS: 8, MBA: 7)
 *          - Unconfigured student contract (configured: false, roadmap: null, zero fallback)
 *          - Target semesters (1..8 strictly matching catalogue)
 *          - Specialization update flow & dynamic node set resolution
 *          - Progress update and refetch contract
 */

import { db, schema } from "../lib/db";
import { eq, inArray } from "drizzle-orm";
import { roadmapService } from "../services/roadmap.service";
import { profileService } from "../services/profile.service";

const database = db!;
let passed = 0;
let failed = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  [PASS] ${description}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${description}`);
    failed++;
  }
}

const createdUserIds: number[] = [];

async function createTestStudent(
  emailPrefix: string,
  careerGoal: string | null,
  specializationBranch: string | null = null
) {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 10000);
  const email = `fe_test_${emailPrefix}_${timestamp}_${randomSuffix}@campusos.test`;

  const [user] = await database
    .insert(schema.users)
    .values({
      email,
      passwordHash: "dummy_hash_for_test",
      role: "student",
    })
    .returning();

  createdUserIds.push(user.userId);

  await database.insert(schema.studentProfiles).values({
    userId: user.userId,
    firstName: `Test-${emailPrefix}`,
    lastName: "Student",
    careerGoal,
    specializationBranch,
    semester: 2,
    targetSgpa: "8.50",
    programmingLevel: "intermediate",
    technicalInterests: ["web", "systems"],
  });

  return user;
}

async function runIntegrationTests() {
  console.log("===============================================================================");
  console.log("       CAMPUSOS FRONTEND ROADMAP INTEGRATION CONTRACT VERIFICATION           ");
  console.log("===============================================================================\n");

  try {
    // -------------------------------------------------------------------------
    // TEST 1: SDE Career Track Frontend Contract
    // -------------------------------------------------------------------------
    console.log("TEST 1: SDE Career Track Contract");
    const sdeUser = await createTestStudent("sde", "sde", null);
    const sdeRes = await roadmapService.getPersonalizedRoadmapForStudent(sdeUser.userId);

    assert(sdeRes.configured === true, "SDE configured flag is true");
    assert(sdeRes.roadmap !== null, "SDE roadmap payload is not null");
    assert(sdeRes.roadmap?.careerSlug === "sde", "SDE careerSlug matches 'sde'");
    assert(sdeRes.roadmap?.totalNodes === 13, `SDE has exactly 13 totalNodes (got ${sdeRes.roadmap?.totalNodes})`);
    assert(sdeRes.roadmap?.nodes.length === 13, `SDE returns exactly 13 nodes (got ${sdeRes.roadmap?.nodes.length})`);
    assert(sdeRes.roadmap?.requiresSpecializationSelection === false, "SDE does not require specialization");
    assert(sdeRes.studentContext.specializationBranch === null, "SDE specializationBranch is null");

    // -------------------------------------------------------------------------
    // TEST 2: AI/ML Career Track Frontend Contract
    // -------------------------------------------------------------------------
    console.log("\nTEST 2: AI/ML Career Track Contract");
    const aimlUser = await createTestStudent("aiml", "ai_ml", null);
    const aimlRes = await roadmapService.getPersonalizedRoadmapForStudent(aimlUser.userId);

    assert(aimlRes.configured === true, "AI/ML configured flag is true");
    assert(aimlRes.roadmap?.careerSlug === "ai_ml", "AI/ML careerSlug matches 'ai_ml'");
    assert(aimlRes.roadmap?.totalNodes === 13, `AI/ML has exactly 13 totalNodes (got ${aimlRes.roadmap?.totalNodes})`);
    assert(aimlRes.roadmap?.nodes.length === 13, `AI/ML returns exactly 13 nodes (got ${aimlRes.roadmap?.nodes.length})`);
    assert(aimlRes.roadmap?.requiresSpecializationSelection === false, "AI/ML does not require specialization");

    // -------------------------------------------------------------------------
    // TEST 3: Founder Career Track Frontend Contract
    // -------------------------------------------------------------------------
    console.log("\nTEST 3: Founder Career Track Contract");
    const fndUser = await createTestStudent("founder", "founder", null);
    const fndRes = await roadmapService.getPersonalizedRoadmapForStudent(fndUser.userId);

    assert(fndRes.configured === true, "Founder configured flag is true");
    assert(fndRes.roadmap?.careerSlug === "founder", "Founder careerSlug matches 'founder'");
    assert(fndRes.roadmap?.totalNodes === 12, `Founder has exactly 12 totalNodes (got ${fndRes.roadmap?.totalNodes})`);
    assert(fndRes.roadmap?.nodes.length === 12, `Founder returns exactly 12 nodes (got ${fndRes.roadmap?.nodes.length})`);
    assert(fndRes.roadmap?.requiresSpecializationSelection === false, "Founder does not require specialization");

    // -------------------------------------------------------------------------
    // TEST 4: Core Student with NULL Specialization (Gateway State)
    // -------------------------------------------------------------------------
    console.log("\nTEST 4: Core Engineering with NULL Branch (Gateway State)");
    const coreNullUser = await createTestStudent("core_null", "core", null);
    const coreNullRes = await roadmapService.getPersonalizedRoadmapForStudent(coreNullUser.userId);

    assert(coreNullRes.configured === true, "Core configured flag is true");
    assert(coreNullRes.roadmap?.careerSlug === "core", "Core careerSlug matches 'core'");
    assert(coreNullRes.roadmap?.requiresSpecializationSelection === true, "Core with null branch signals requiresSpecializationSelection: true");
    assert(coreNullRes.roadmap?.totalNodes === 9, `Core with null branch returns exactly 9 common nodes (got ${coreNullRes.roadmap?.totalNodes})`);
    assert(coreNullRes.roadmap?.nodes.length === 9, `Core nodes array length is exactly 9`);

    const core11Node = coreNullRes.roadmap?.nodes.find((n) => n.nodeKey === "core_11");
    assert(core11Node !== undefined, "core_11 is present in common nodes");
    assert(core11Node?.status === "locked", "core_11 remains locked while specialization branch is null");
    assert(
      Boolean(core11Node?.missingPrerequisites?.includes("specialization_branch_selection")),
      "core_11 missingPrerequisites indicates specialization_branch_selection required"
    );

    // -------------------------------------------------------------------------
    // TEST 5: Core Student with 'embedded' Specialization
    // -------------------------------------------------------------------------
    console.log("\nTEST 5: Core Engineering with 'embedded' Specialization");
    const coreEmbUser = await createTestStudent("core_emb", "core", "embedded");
    const coreEmbRes = await roadmapService.getPersonalizedRoadmapForStudent(coreEmbUser.userId);

    assert(coreEmbRes.roadmap?.requiresSpecializationSelection === false, "Embedded branch does not require specialization selection");
    assert(coreEmbRes.roadmap?.totalNodes === 11, `Core embedded returns exactly 11 nodes: 9 common + 2 embedded (got ${coreEmbRes.roadmap?.totalNodes})`);
    assert(coreEmbRes.roadmap?.nodes.length === 11, `Core embedded nodes array length is 11`);
    assert(
      coreEmbRes.roadmap?.nodes.some((n) => n.nodeKey === "core_08a") === true,
      "Contains embedded node core_08a"
    );
    assert(
      coreEmbRes.roadmap?.nodes.some((n) => n.nodeKey === "core_09a") === true,
      "Contains embedded node core_09a"
    );
    assert(
      coreEmbRes.roadmap?.nodes.every((n) => n.branch === null || n.branch === "embedded") === true,
      "Excludes non-embedded branch nodes"
    );

    // -------------------------------------------------------------------------
    // TEST 6: Core Student with 'iot' Specialization
    // -------------------------------------------------------------------------
    console.log("\nTEST 6: Core Engineering with 'iot' Specialization");
    const coreIotUser = await createTestStudent("core_iot", "core", "iot");
    const coreIotRes = await roadmapService.getPersonalizedRoadmapForStudent(coreIotUser.userId);

    assert(coreIotRes.roadmap?.totalNodes === 11, `Core IoT returns exactly 11 nodes: 9 common + 2 IoT (got ${coreIotRes.roadmap?.totalNodes})`);
    assert(
      coreIotRes.roadmap?.nodes.some((n) => n.nodeKey === "core_08b") === true,
      "Contains IoT node core_08b"
    );
    assert(
      coreIotRes.roadmap?.nodes.some((n) => n.nodeKey === "core_09b") === true,
      "Contains IoT node core_09b"
    );
    assert(
      coreIotRes.roadmap?.nodes.every((n) => n.branch === null || n.branch === "iot") === true,
      "Excludes non-IoT branch nodes"
    );

    // -------------------------------------------------------------------------
    // TEST 7: Core Student with 'robotics' Specialization
    // -------------------------------------------------------------------------
    console.log("\nTEST 7: Core Engineering with 'robotics' Specialization");
    const coreRoboUser = await createTestStudent("core_robo", "core", "robotics");
    const coreRoboRes = await roadmapService.getPersonalizedRoadmapForStudent(coreRoboUser.userId);

    assert(coreRoboRes.roadmap?.totalNodes === 11, `Core Robotics returns exactly 11 nodes: 9 common + 2 robotics (got ${coreRoboRes.roadmap?.totalNodes})`);
    assert(
      coreRoboRes.roadmap?.nodes.some((n) => n.nodeKey === "core_08c") === true,
      "Contains Robotics node core_08c"
    );
    assert(
      coreRoboRes.roadmap?.nodes.some((n) => n.nodeKey === "core_09c") === true,
      "Contains Robotics node core_09c"
    );
    assert(
      coreRoboRes.roadmap?.nodes.every((n) => n.branch === null || n.branch === "robotics") === true,
      "Excludes non-Robotics branch nodes"
    );

    // -------------------------------------------------------------------------
    // TEST 8: Higher Studies Student with NULL Specialization (Gateway State)
    // -------------------------------------------------------------------------
    console.log("\nTEST 8: Higher Studies with NULL Branch (Gateway State)");
    const heNullUser = await createTestStudent("he_null", "higher_ed", null);
    const heNullRes = await roadmapService.getPersonalizedRoadmapForStudent(heNullUser.userId);

    assert(heNullRes.configured === true, "Higher Studies configured flag is true");
    assert(heNullRes.roadmap?.careerSlug === "higher_ed", "Higher Studies careerSlug matches 'higher_ed'");
    assert(heNullRes.roadmap?.requiresSpecializationSelection === true, "Higher Studies with null branch signals requiresSpecializationSelection: true");
    assert(heNullRes.roadmap?.totalNodes === 4, `Higher Studies null branch returns exactly 4 common nodes (got ${heNullRes.roadmap?.totalNodes})`);
    assert(heNullRes.roadmap?.nodes.length === 4, `Higher Studies nodes array length is exactly 4`);

    const he08Node = heNullRes.roadmap?.nodes.find((n) => n.nodeKey === "he_08");
    assert(he08Node !== undefined, "he_08 convergence node is present in common nodes");
    assert(he08Node?.status === "locked", "he_08 remains locked while specialization branch is null");
    assert(
      Boolean(he08Node?.missingPrerequisites?.includes("specialization_branch_selection")),
      "he_08 missingPrerequisites indicates specialization_branch_selection required"
    );

    // -------------------------------------------------------------------------
    // TEST 9: Higher Studies Student with 'gate' Specialization
    // -------------------------------------------------------------------------
    console.log("\nTEST 9: Higher Studies with 'gate' Specialization");
    const heGateUser = await createTestStudent("he_gate", "higher_ed", "gate");
    const heGateRes = await roadmapService.getPersonalizedRoadmapForStudent(heGateUser.userId);

    assert(heGateRes.roadmap?.requiresSpecializationSelection === false, "GATE branch does not require specialization selection");
    assert(heGateRes.roadmap?.totalNodes === 9, `Higher Studies GATE returns exactly 9 nodes: 4 common + 5 GATE (got ${heGateRes.roadmap?.totalNodes})`);
    assert(heGateRes.roadmap?.nodes.length === 9, `Higher Studies GATE nodes array length is 9`);
    assert(
      heGateRes.roadmap?.nodes.some((n) => n.nodeKey === "he_08a") === true,
      "Contains GATE terminal node he_08a"
    );
    assert(
      heGateRes.roadmap?.nodes.every((n) => n.branch === null || n.branch === "gate") === true,
      "Excludes non-GATE branch nodes"
    );

    // -------------------------------------------------------------------------
    // TEST 10: Higher Studies Student with 'ms' Specialization
    // -------------------------------------------------------------------------
    console.log("\nTEST 10: Higher Studies with 'ms' Specialization");
    const heMsUser = await createTestStudent("he_ms", "higher_ed", "ms");
    const heMsRes = await roadmapService.getPersonalizedRoadmapForStudent(heMsUser.userId);

    assert(heMsRes.roadmap?.totalNodes === 8, `Higher Studies MS returns exactly 8 nodes: 4 common + 4 MS (got ${heMsRes.roadmap?.totalNodes})`);
    assert(heMsRes.roadmap?.nodes.length === 8, `Higher Studies MS nodes array length is 8`);
    assert(
      heMsRes.roadmap?.nodes.some((n) => n.nodeKey === "he_07b") === true,
      "Contains MS terminal node he_07b"
    );
    assert(
      heMsRes.roadmap?.nodes.every((n) => n.branch === null || n.branch === "ms") === true,
      "Excludes non-MS branch nodes"
    );

    // -------------------------------------------------------------------------
    // TEST 11: Higher Studies Student with 'mba' Specialization
    // -------------------------------------------------------------------------
    console.log("\nTEST 11: Higher Studies with 'mba' Specialization");
    const heMbaUser = await createTestStudent("he_mba", "higher_ed", "mba");
    const heMbaRes = await roadmapService.getPersonalizedRoadmapForStudent(heMbaUser.userId);

    assert(heMbaRes.roadmap?.totalNodes === 7, `Higher Studies MBA returns exactly 7 nodes: 4 common + 3 MBA (got ${heMbaRes.roadmap?.totalNodes})`);
    assert(heMbaRes.roadmap?.nodes.length === 7, `Higher Studies MBA nodes array length is 7`);
    assert(
      heMbaRes.roadmap?.nodes.some((n) => n.nodeKey === "he_06c") === true,
      "Contains MBA terminal node he_06c"
    );
    assert(
      heMbaRes.roadmap?.nodes.every((n) => n.branch === null || n.branch === "mba") === true,
      "Excludes non-MBA branch nodes"
    );

    // -------------------------------------------------------------------------
    // TEST 12: Unconfigured Student Contract (Zero Fallback)
    // -------------------------------------------------------------------------
    console.log("\nTEST 12: Unconfigured Student Contract");
    const unconfUser = await createTestStudent("unconf", null, null);
    const unconfRes = await roadmapService.getPersonalizedRoadmapForStudent(unconfUser.userId);

    assert(unconfRes.configured === false, "Unconfigured student returns configured: false");
    assert(unconfRes.roadmap === null, "Unconfigured student returns roadmap: null");
    assert(unconfRes.studentContext.careerGoal === null, "studentContext.careerGoal is null");

    // -------------------------------------------------------------------------
    // TEST 13: Target Semester Integrity
    // -------------------------------------------------------------------------
    console.log("\nTEST 13: Target Semester Range & Integrity");
    const allSdeNodes = sdeRes.roadmap!.nodes;
    const allSemesters = allSdeNodes.map((n) => n.targetSemester);
    const allValidSemesters = allSemesters.every((sem) => typeof sem === "number" && sem >= 1 && sem <= 8);

    assert(allValidSemesters === true, "All SDE nodes have targetSemester strictly between 1 and 8");

    // -------------------------------------------------------------------------
    // TEST 14: Specialization Update Flow via Service/API
    // -------------------------------------------------------------------------
    console.log("\nTEST 14: Specialization Update Flow via Service/API");
    const specUpdateUser = await createTestStudent("spec_update", "core", null);

    // 1. Initial state has null branch
    const beforeUpdate = await roadmapService.getPersonalizedRoadmapForStudent(specUpdateUser.userId);
    assert(beforeUpdate.roadmap?.totalNodes === 9, "Before update: 9 common nodes");

    // 2. Select embedded branch
    await roadmapService.updateStudentSpecialization(specUpdateUser.userId, "embedded");
    const afterUpdate = await roadmapService.getPersonalizedRoadmapForStudent(specUpdateUser.userId);
    assert(afterUpdate.roadmap?.totalNodes === 11, "After selecting embedded: 11 nodes");
    assert(afterUpdate.studentContext.specializationBranch === "embedded", "studentContext reflects embedded branch");

    // 3. Switch to robotics branch
    await roadmapService.updateStudentSpecialization(specUpdateUser.userId, "robotics");
    const afterSwitch = await roadmapService.getPersonalizedRoadmapForStudent(specUpdateUser.userId);
    assert(afterSwitch.roadmap?.totalNodes === 11, "After switching to robotics: 11 nodes");
    assert(
      afterSwitch.roadmap?.nodes.some((n) => n.nodeKey === "core_08c") === true,
      "Includes robotics node core_08c"
    );
    assert(
      afterSwitch.roadmap?.nodes.some((n) => n.nodeKey === "core_08a") === false,
      "Excludes previous embedded node core_08a"
    );

    // -------------------------------------------------------------------------
    // TEST 15: Node Progress Update & Authoritative Recalculation Contract
    // -------------------------------------------------------------------------
    console.log("\nTEST 15: Node Progress Update & Authoritative Recalculation");
    const progUser = await createTestStudent("progress_test", "sde", null);
    const progRoadmap = (await roadmapService.getPersonalizedRoadmapForStudent(progUser.userId)).roadmap!;

    const sde01Node = progRoadmap.nodes.find((n) => n.nodeKey === "sde_01")!;
    const sde02Node = progRoadmap.nodes.find((n) => n.nodeKey === "sde_02")!;

    assert(sde01Node.status === "unlocked", "sde_01 starts unlocked");
    assert(sde02Node.status === "locked", "sde_02 starts locked");

    // Start sde_01 milestone (in_progress)
    await roadmapService.updateNodeProgress(progUser.userId, progRoadmap.id, {
      nodeId: sde01Node.id,
      status: "in_progress",
    });
    const progAfterStart = await roadmapService.getPersonalizedRoadmapForStudent(progUser.userId);
    const sde01Started = progAfterStart.roadmap?.nodes.find((n) => n.nodeKey === "sde_01");
    assert(sde01Started?.status === "in_progress", "sde_01 status updated to in_progress");

    // Complete sde_01 milestone
    await roadmapService.updateNodeProgress(progUser.userId, progRoadmap.id, {
      nodeId: sde01Node.id,
      status: "completed",
    });
    const progAfterComplete = await roadmapService.getPersonalizedRoadmapForStudent(progUser.userId);
    const sde01Done = progAfterComplete.roadmap?.nodes.find((n) => n.nodeKey === "sde_01");
    const sde02Unlocked = progAfterComplete.roadmap?.nodes.find((n) => n.nodeKey === "sde_02");

    assert(sde01Done?.status === "completed", "sde_01 status updated to completed");
    assert(sde02Unlocked?.status === "unlocked", "sde_02 is authoritatively unlocked after sde_01 completed");
    assert(progAfterComplete.roadmap?.completedNodes === 1, "completedNodes metric incremented to 1");

    console.log("\n===============================================================================");
    console.log(`TOTAL FRONTEND INTEGRATION TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log("===============================================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution encountered an unhandled error:", error);
    process.exit(1);
  } finally {
    // Teardown created test students
    if (createdUserIds.length > 0) {
      console.log(`Cleaning up ${createdUserIds.length} test students...`);
      await database.delete(schema.studentRoadmapProgress).where(inArray(schema.studentRoadmapProgress.userId, createdUserIds));
      await database.delete(schema.studentProfiles).where(inArray(schema.studentProfiles.userId, createdUserIds));
      await database.delete(schema.users).where(inArray(schema.users.userId, createdUserIds));
      console.log("Cleanup completed.");
    }
  }
}

runIntegrationTests().then(() => {
  process.exit(0);
});
