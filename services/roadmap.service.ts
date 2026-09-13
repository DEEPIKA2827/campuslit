/**
 * @file services/roadmap.service.ts
 * @description Business Logic Layer (BLL) for Career Roadmaps, Ordered Nodes, and Student Progress.
 * @domain Bounded Context: Student Career Velocity & Skill Roadmaps
 * @purpose Implements deterministic personalized roadmap matching, prerequisite verification, and student completion tracking.
 */

import {
  roadmapRepository,
  RoadmapRepository,
  RoadmapWithNodes,
  StudentNodeProgressDetail,
  CanonicalRoadmapNodeRecord,
} from "@/repositories/roadmap.repository";
import { userRepository, UserRepository } from "@/repositories/user.repository";
import {
  RoadmapValidation,
  CreateRoadmapInput,
  CreateRoadmapNodeInput,
  UpdateNodeProgressInput,
} from "@/validations/roadmap.validation";
import {
  RoadmapDTO,
  StudentRoadmapProgressDTO,
  RoadmapWithProgressSummaryDTO,
  RoadmapProgressStatus,
  PersonalizedRoadmapResponseDTO,
  PersonalizedRoadmapDTO,
  PersonalizedRoadmapNodeDTO,
  RoadmapNodeStatus,
} from "@/types/api.types";
import { Logger } from "@/lib/logger";

/**
 * Pure helper verifying direct prerequisites and explicit convergence rules for a milestone node.
 */
function checkNodePrerequisites(
  node: CanonicalRoadmapNodeRecord,
  careerSlug: string,
  specializationBranch: string | null,
  progressByNodeKey: Map<string, RoadmapProgressStatus>
): { met: boolean; missingPrereqs: string[] } {
  const missingPrereqs: string[] = [];

  // Direct prerequisite keys check
  if (Array.isArray(node.prerequisiteKeys)) {
    for (const prereqKey of node.prerequisiteKeys) {
      if (progressByNodeKey.get(prereqKey) !== "completed") {
        missingPrereqs.push(prereqKey);
      }
    }
  }

  // Explicit convergence rule for Core track: core_11
  if (careerSlug === "core" && node.nodeKey === "core_11") {
    if (!specializationBranch) {
      missingPrereqs.push("specialization_branch_selection");
    } else {
      const terminalMap: Record<string, string> = {
        embedded: "core_09a",
        iot: "core_09b",
        robotics: "core_09c",
      };
      const terminalKey = terminalMap[specializationBranch];
      if (terminalKey && progressByNodeKey.get(terminalKey) !== "completed") {
        missingPrereqs.push(terminalKey);
      }
    }
  }

  // Explicit convergence rule for Higher Ed track: he_08
  if (careerSlug === "higher_ed" && node.nodeKey === "he_08") {
    if (!specializationBranch) {
      missingPrereqs.push("specialization_branch_selection");
    } else {
      const terminalMap: Record<string, string> = {
        gate: "he_08a",
        ms: "he_07b",
        mba: "he_06c",
      };
      const terminalKey = terminalMap[specializationBranch];
      if (terminalKey && progressByNodeKey.get(terminalKey) !== "completed") {
        missingPrereqs.push(terminalKey);
      }
    }
  }

  return {
    met: missingPrereqs.length === 0,
    missingPrereqs,
  };
}

export class RoadmapService {
  constructor(
    private roadmapRepo: RoadmapRepository = roadmapRepository,
    private userRepo: UserRepository = userRepository
  ) {}

  /**
   * Retrieves the personalized roadmap for a student based strictly on their profile's career_goal
   * and specialization_branch. Returns unconfigured response if career_goal is null or empty.
   */
  async getPersonalizedRoadmapForStudent(userId: number): Promise<PersonalizedRoadmapResponseDTO> {
    Logger.info("RoadmapService.getPersonalizedRoadmapForStudent invoked", { userId });

    if (!userId || typeof userId !== "number" || userId <= 0) {
      throw new Error("Validation Error: User ID must be a positive integer.");
    }

    // 1. Verify user exists
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error("Not Found Error: User does not exist.");
    }

    // 2. Fetch profile
    const profile = await this.userRepo.getProfile(userId);

    // If profile or careerGoal is missing/empty, return deterministic unconfigured response
    if (!profile || !profile.careerGoal || profile.careerGoal.trim().length === 0) {
      return {
        configured: false,
        message: "Career goal has not been selected yet. Please complete onboarding or update your profile career goal to receive a personalized roadmap.",
        studentContext: {
          userId,
          careerGoal: null,
          specializationBranch: profile?.specializationBranch ?? null,
          semester: profile?.semester ?? null,
          technicalInterests: profile?.technicalInterests ?? null,
        },
        roadmap: null,
      };
    }

    const careerSlug = profile.careerGoal.trim().toLowerCase();
    const specializationBranch = profile.specializationBranch ? profile.specializationBranch.trim().toLowerCase() : null;

    // 3. Resolve canonical roadmap by career slug
    const roadmap = await this.roadmapRepo.getRoadmapByCareerSlug(careerSlug);
    if (!roadmap) {
      return {
        configured: false,
        message: `No active roadmap found for career track '${careerSlug}'.`,
        studentContext: {
          userId,
          careerGoal: profile.careerGoal,
          specializationBranch,
          semester: profile.semester ?? null,
          technicalInterests: profile.technicalInterests ?? null,
        },
        roadmap: null,
      };
    }

    // 4. Load all canonical nodes for this roadmap
    const allNodes = await this.roadmapRepo.listCanonicalNodesByRoadmap(roadmap.roadmapId);

    // 5. Filter nodes by specialization branch:
    // Common nodes (branch === null) are always included.
    // Branch nodes are included ONLY if student has that specialization branch selected.
    const visibleNodes = allNodes.filter((node) => {
      if (node.branch === null) return true;
      return specializationBranch !== null && node.branch.toLowerCase() === specializationBranch;
    });

    // 6. Fetch student progress records for this roadmap
    const progressRecords = await this.roadmapRepo.getStudentProgressRecordsForRoadmap(userId, roadmap.roadmapId);
    const progressByNodeKey = new Map<string, RoadmapProgressStatus>();
    for (const record of progressRecords) {
      if (record.nodeKey) {
        progressByNodeKey.set(record.nodeKey, record.status);
      }
    }

    // 7. Calculate status for each visible node based on actual user progress and prerequisites
    const personalizedNodes: PersonalizedRoadmapNodeDTO[] = visibleNodes.map((node) => {
      const userStatus = progressByNodeKey.get(node.nodeKey);
      const prereqCheck = checkNodePrerequisites(node, careerSlug, specializationBranch, progressByNodeKey);

      let status: RoadmapNodeStatus;
      let isUnlocked = false;

      if (userStatus === "completed") {
        status = "completed";
        isUnlocked = true;
      } else if (!prereqCheck.met) {
        status = "locked";
        isUnlocked = false;
      } else {
        isUnlocked = true;
        if (userStatus === "in_progress") {
          status = "in_progress";
        } else {
          status = "unlocked";
        }
      }

      return {
        id: node.nodeId,
        nodeId: node.nodeId,
        roadmapId: node.roadmapId,
        nodeKey: node.nodeKey,
        sequenceNo: node.sequenceNo,
        title: node.title,
        description: node.description,
        category: node.category,
        tier: node.tier,
        branch: node.branch,
        branchKey: node.branchKey,
        isElective: node.isElective,
        isGateway: node.isGateway,
        isConvergence: node.isConvergence,
        targetSemester: node.targetSemester,
        difficulty: node.difficulty,
        skills: node.skills,
        prerequisiteKeys: node.prerequisiteKeys,
        evidencePrompt: node.evidencePrompt,
        status,
        isUnlocked,
        prerequisiteSatisfied: prereqCheck.met,
        lockedReason: !prereqCheck.met
          ? prereqCheck.missingPrereqs.includes("specialization_branch_selection")
            ? "Requires selecting a specialization branch"
            : `Prerequisites not met (${prereqCheck.missingPrereqs.join(", ")})`
          : null,
        ...(prereqCheck.missingPrereqs.length > 0 && { missingPrerequisites: prereqCheck.missingPrereqs }),
      };
    });

    // 8. Calculate summary metrics
    const totalNodes = personalizedNodes.length;
    const completedNodes = personalizedNodes.filter((n) => n.status === "completed").length;
    const inProgressNodes = personalizedNodes.filter((n) => n.status === "in_progress").length;
    const progressPercentage = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;

    const requiresSpecializationSelection =
      (careerSlug === "core" || careerSlug === "higher_ed") && specializationBranch === null;

    const specializationPrompt = requiresSpecializationSelection
      ? careerSlug === "core"
        ? "Please select your Core Engineering specialization branch (Embedded Systems, IoT, or Robotics) to unlock specialized milestones."
        : "Please select your Higher Studies specialization branch (GATE, MS Abroad, or MBA/CAT) to unlock specialized milestones."
      : null;

    const personalizedRoadmap: PersonalizedRoadmapDTO = {
      id: roadmap.roadmapId,
      title: roadmap.title,
      description: roadmap.description,
      careerSlug: roadmap.careerSlug ?? careerSlug,
      totalNodes,
      completedNodes,
      inProgressNodes,
      progressPercentage,
      requiresSpecializationSelection,
      specializationPrompt,
      nodes: personalizedNodes,
    };

    return {
      configured: true,
      studentContext: {
        userId,
        careerGoal: profile.careerGoal,
        specializationBranch,
        semester: profile.semester ?? null,
        technicalInterests: profile.technicalInterests ?? null,
      },
      roadmap: personalizedRoadmap,
    };
  }

  /**
   * Updates student's specialization branch with strict track validation and recalculates their roadmap.
   */
  async updateStudentSpecialization(
    userId: number,
    branch: string | null
  ): Promise<PersonalizedRoadmapResponseDTO> {
    Logger.info("RoadmapService.updateStudentSpecialization invoked", { userId, branch });

    if (!userId || typeof userId !== "number" || userId <= 0) {
      throw new Error("Validation Error: User ID must be a positive integer.");
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error("Not Found Error: User does not exist.");
    }

    const profile = await this.userRepo.getProfile(userId);
    if (!profile) {
      throw new Error("Not Found Error: Student profile not found. Please complete profile setup first.");
    }

    const validation = RoadmapValidation.validateSpecializationBranchInput(profile.careerGoal, branch);
    if (!validation.valid || !validation.data) {
      throw new Error(`Validation Error: ${validation.errors?.join(", ")}`);
    }

    // Persist branch update on profile
    await this.userRepo.upsertProfile(userId, {
      firstName: profile.firstName,
      lastName: profile.lastName,
      collegeId: profile.collegeId ?? 0,
      courseId: profile.courseId ?? 0,
      semester: profile.semester,
      careerGoal: profile.careerGoal,
      evaluationScheme: profile.evaluationScheme,
      targetSgpa: profile.targetSgpa,
      programmingLevel: profile.programmingLevel,
      technicalInterests: profile.technicalInterests,
      specializationBranch: validation.data.specializationBranch,
    });

    return this.getPersonalizedRoadmapForStudent(userId);
  }

  /**
   * Lists all master roadmaps.
   */
  async listRoadmaps(): Promise<RoadmapDTO[]> {
    Logger.debug("RoadmapService.listRoadmaps invoked");
    return this.roadmapRepo.listRoadmaps();
  }

  /**
   * Retrieves a roadmap by primary key.
   */
  async getRoadmapById(roadmapId: number): Promise<RoadmapDTO> {
    Logger.debug("RoadmapService.getRoadmapById invoked", { roadmapId });

    if (!roadmapId || typeof roadmapId !== "number" || roadmapId <= 0) {
      throw new Error("Validation Error: Roadmap ID must be a positive integer.");
    }

    const roadmap = await this.roadmapRepo.getRoadmapById(roadmapId);
    if (!roadmap) {
      throw new Error(`Not Found Error: Roadmap not found with ID: ${roadmapId}`);
    }

    return roadmap;
  }

  /**
   * Retrieves a roadmap and all its ordered nodes.
   */
  async getRoadmapWithNodes(roadmapId: number): Promise<RoadmapWithNodes> {
    Logger.debug("RoadmapService.getRoadmapWithNodes invoked", { roadmapId });

    if (!roadmapId || typeof roadmapId !== "number" || roadmapId <= 0) {
      throw new Error("Validation Error: Roadmap ID must be a positive integer.");
    }

    const result = await this.roadmapRepo.getRoadmapWithNodes(roadmapId);
    if (!result) {
      throw new Error(`Not Found Error: Roadmap not found with ID: ${roadmapId}`);
    }

    return result;
  }

  /**
   * Lists all roadmaps paired with student completion percentages and progress metrics.
   */
  async listStudentRoadmaps(userId: number): Promise<RoadmapWithProgressSummaryDTO[]> {
    Logger.debug("RoadmapService.listStudentRoadmaps invoked", { userId });

    if (!userId || typeof userId !== "number" || userId <= 0) {
      throw new Error("Validation Error: User ID must be a positive integer.");
    }

    return this.roadmapRepo.listUserRoadmapsWithProgress(userId);
  }

  /**
   * Retrieves all nodes in a roadmap alongside the student's individual node progress.
   */
  async getStudentRoadmapProgress(
    userId: number,
    roadmapId: number
  ): Promise<StudentNodeProgressDetail[]> {
    Logger.debug("RoadmapService.getStudentRoadmapProgress invoked", { userId, roadmapId });

    if (!userId || typeof userId !== "number" || userId <= 0) {
      throw new Error("Validation Error: User ID must be a positive integer.");
    }
    if (!roadmapId || typeof roadmapId !== "number" || roadmapId <= 0) {
      throw new Error("Validation Error: Roadmap ID must be a positive integer.");
    }

    const roadmap = await this.roadmapRepo.getRoadmapById(roadmapId);
    if (!roadmap) {
      throw new Error(`Not Found Error: Roadmap not found with ID: ${roadmapId}`);
    }

    return this.roadmapRepo.getStudentProgressForRoadmap(userId, roadmapId);
  }

  /**
   * Atomically creates a roadmap with its sequenced nodes.
   */
  async createRoadmapWithNodes(
    roadmapInput: Partial<CreateRoadmapInput>,
    nodesInput: Partial<CreateRoadmapNodeInput>[] = []
  ): Promise<RoadmapWithNodes> {
    Logger.info("RoadmapService.createRoadmapWithNodes invoked", { title: roadmapInput.title });

    // Step 1: Syntactic Validation for Roadmap
    const roadmapValidation = RoadmapValidation.validateCreateRoadmapInput(roadmapInput);
    if (!roadmapValidation.valid || !roadmapValidation.data) {
      throw new Error(`Validation Error: ${roadmapValidation.errors?.join(", ")}`);
    }

    // Step 2: Syntactic Validation for Nodes
    const validatedNodes: Omit<CreateRoadmapNodeInput, "roadmapId">[] = [];
    for (let i = 0; i < nodesInput.length; i++) {
      const n = nodesInput[i];
      const nodeValidation = RoadmapValidation.validateCreateNodeInput(n);
      if (!nodeValidation.valid || !nodeValidation.data) {
        throw new Error(`Validation Error on node #${i + 1}: ${nodeValidation.errors?.join(", ")}`);
      }
      validatedNodes.push({
        title: nodeValidation.data.title,
        description: nodeValidation.data.description,
        sequenceNo: nodeValidation.data.sequenceNo,
      });
    }

    // Step 3: Atomic Persistence via Data Access Layer
    return this.roadmapRepo.createRoadmapWithNodes(roadmapValidation.data, validatedNodes);
  }

  /**
   * Updates student progress on a specific roadmap node after strictly validating node ownership to the roadmap
   * and ensuring that prerequisite requirements are met.
   */
  async updateNodeProgress(
    userId: number,
    roadmapId: number,
    input: Partial<UpdateNodeProgressInput>
  ): Promise<StudentRoadmapProgressDTO> {
    Logger.info("RoadmapService.updateNodeProgress invoked", { userId, roadmapId, nodeId: input.nodeId });

    if (!userId || typeof userId !== "number" || userId <= 0) {
      throw new Error("Validation Error: User ID must be a positive integer.");
    }
    if (!roadmapId || typeof roadmapId !== "number" || roadmapId <= 0) {
      throw new Error("Validation Error: Roadmap ID must be a positive integer.");
    }

    // Step 1: Syntactic Validation
    const validation = RoadmapValidation.validateUpdateNodeProgressInput(input);
    if (!validation.valid || !validation.data) {
      throw new Error(`Validation Error: ${validation.errors?.join(", ")}`);
    }

    // Step 2: Semantic Check — Ensure user exists
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error("Not Found Error: User does not exist.");
    }

    // Step 3: Semantic Check — Ensure roadmap exists
    const roadmap = await this.roadmapRepo.getRoadmapById(roadmapId);
    if (!roadmap) {
      throw new Error(`Not Found Error: Roadmap not found with ID: ${roadmapId}`);
    }

    // Step 4: Semantic Check — Ensure node exists and belongs to the specified roadmap
    const canonicalNode = await this.roadmapRepo.getCanonicalNodeById(validation.data.nodeId);
    if (!canonicalNode) {
      throw new Error(`Not Found Error: Roadmap node not found with ID: ${validation.data.nodeId}`);
    }
    if (canonicalNode.roadmapId !== roadmapId) {
      throw new Error(
        `Validation Error: Node (ID: ${validation.data.nodeId}) does not belong to Roadmap (ID: ${roadmapId}).`
      );
    }

    // Step 5: If status is 'in_progress' or 'completed', check that node prerequisites are satisfied
    if (validation.data.status === "in_progress" || validation.data.status === "completed") {
      const profile = await this.userRepo.getProfile(userId);
      const progressRecords = await this.roadmapRepo.getStudentProgressRecordsForRoadmap(userId, roadmapId);
      const progressByNodeKey = new Map<string, RoadmapProgressStatus>();
      for (const record of progressRecords) {
        if (record.nodeKey) {
          progressByNodeKey.set(record.nodeKey, record.status);
        }
      }
      const careerSlug = (roadmap.careerSlug || profile?.careerGoal || "").toLowerCase();
      const branch = profile?.specializationBranch ? profile.specializationBranch.toLowerCase() : null;
      const prereqCheck = checkNodePrerequisites(canonicalNode, careerSlug, branch, progressByNodeKey);
      if (!prereqCheck.met) {
        throw new Error(
          `Validation Error: Cannot set node '${canonicalNode.nodeKey}' to '${validation.data.status}'. Missing prerequisites: ${prereqCheck.missingPrereqs.join(", ")}.`
        );
      }
    }

    // Step 6: Persist via Data Access Layer
    return this.roadmapRepo.updateNodeProgress(
      userId,
      roadmapId,
      validation.data.nodeId,
      validation.data.status
    );
  }

  /**
   * Clears / resets all node progress for a student on a roadmap.
   */
  async resetStudentProgress(userId: number, roadmapId: number): Promise<boolean> {
    Logger.info("RoadmapService.resetStudentProgress invoked", { userId, roadmapId });

    if (!userId || typeof userId !== "number" || userId <= 0) {
      throw new Error("Validation Error: User ID must be a positive integer.");
    }
    if (!roadmapId || typeof roadmapId !== "number" || roadmapId <= 0) {
      throw new Error("Validation Error: Roadmap ID must be a positive integer.");
    }

    return this.roadmapRepo.resetStudentRoadmapProgress(userId, roadmapId);
  }

  /**
   * Deletes a roadmap and its cascading nodes.
   */
  async deleteRoadmap(roadmapId: number): Promise<boolean> {
    Logger.info("RoadmapService.deleteRoadmap invoked", { roadmapId });

    if (!roadmapId || typeof roadmapId !== "number" || roadmapId <= 0) {
      throw new Error("Validation Error: Roadmap ID must be a positive integer.");
    }

    const deleted = await this.roadmapRepo.deleteRoadmap(roadmapId);
    if (!deleted) {
      throw new Error(`Not Found Error: Roadmap not found with ID: ${roadmapId}`);
    }

    return true;
  }
}

export const roadmapService = new RoadmapService();
