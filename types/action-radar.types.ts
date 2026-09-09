/**
 * @file types/action-radar.types.ts
 * @description Data contracts and DTOs for the CampusOS Proactive Student Action Layer.
 * @purpose Defines types for multi-domain signal aggregation, Rule-of-One primary missions, urgency alerts, and radar metrics.
 */

export type ActionCategory =
  | "attendance_recovery"
  | "exam_priority"
  | "deadline_submission"
  | "roadmap_milestone"
  | "discovery_recommendation";

export type ActionUrgency = "critical" | "high" | "medium" | "low";

export interface AttachedResourceDTO {
  title: string;
  url: string;
  type: string;
}

export interface PrimaryMissionDTO {
  id: string;
  category: ActionCategory;
  urgency: ActionUrgency;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  xpReward: number;
  actionUrl: string;
  actionLabel: string;
  contextBadge: string;
  isImpossibleRecovery?: boolean;
  recoveryNote?: string;
  attachedResource?: AttachedResourceDTO;
}

export interface ActionAlertItemDTO {
  id: string;
  category: ActionCategory;
  urgency: ActionUrgency;
  title: string;
  description: string;
  metricLabel: string;
  metricValue: string;
  actionUrl: string;
  actionLabel: string;
  dueInDays?: number | null;
  dueInHours?: number | null;
  isImpossibleRecovery?: boolean;
}

export interface ActionTimelineItemDTO {
  id: string;
  category: ActionCategory;
  urgency: ActionUrgency;
  title: string;
  timing: string;
  actionUrl: string;
  actionLabel: string;
  badge: string;
}

export interface RadarMetricsDTO {
  overallAttendancePercentage: number;
  atRiskCoursesCount: number;
  totalCoursesCount: number;
  upcomingDeadlinesCount: number;
  activeRoadmapTitle: string;
  activeRoadmapProgressPercentage: number;
  streakDays: number;
}

export interface ActionRadarResponseDTO {
  primaryMission: PrimaryMissionDTO;
  urgentAlerts: ActionAlertItemDTO[];
  radarMetrics: RadarMetricsDTO;
  actionTimeline: ActionTimelineItemDTO[];
  timestampIST: string;
}

export interface ActionCandidate {
  id: string;
  category: ActionCategory;
  urgency: ActionUrgency;
  compositeScore: number;
  timeProximitySeconds: number; // For tie-breaking (lower = sooner)
  severityMagnitude: number;    // For tie-breaking (higher = more severe)
  title: string;
  subtitle: string;
  description: string;
  estimatedMinutes: number;
  xpReward: number;
  actionUrl: string;
  actionLabel: string;
  contextBadge: string;
  metricLabel?: string;
  metricValue?: string;
  dueInDays?: number | null;
  dueInHours?: number | null;
  isImpossibleRecovery?: boolean;
  recoveryNote?: string;
  attachedResource?: AttachedResourceDTO;
}
