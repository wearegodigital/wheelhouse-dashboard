import type { BadgeProps } from "@/components/ui/badge"
import type { ExecutionPattern, DistributionMode } from "@/types"

type BadgeVariant = NonNullable<BadgeProps["variant"]>

/**
 * Get the appropriate badge variant for a status string.
 * Consolidates status-to-variant mapping used across the codebase.
 */
export function getStatusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "completed":
      return "success"
    case "running":
    case "validating":
      return "default"
    case "failed":
    case "cancelled":
      return "destructive"
    case "ready":
      return "warning"
    case "paused":
    case "draft":
    case "planning":
    case "pending":
    case "spawned":
      return "secondary"
    default:
      return "outline"
  }
}

/**
 * Pluralize a word based on count.
 * @example pluralize(1, "sprint") => "sprint"
 * @example pluralize(2, "sprint") => "sprints"
 * @example pluralize(0, "task") => "tasks"
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`)
}

/**
 * Get human-readable text for execution pattern.
 */
export function getPatternBadgeText(pattern: ExecutionPattern | null): string {
  if (!pattern) return "Standard"
  switch (pattern) {
    case "sequential":
      return "Sequential"
    case "tournament":
      return "Tournament"
    case "cascade":
      return "Cascade"
    default:
      return pattern
  }
}

/**
 * Get badge variant for execution pattern.
 */
export function getPatternBadgeVariant(pattern: ExecutionPattern | null): BadgeVariant {
  if (!pattern) return "outline"
  switch (pattern) {
    case "sequential":
      return "secondary"
    case "tournament":
      return "default"
    case "cascade":
      return "warning"
    default:
      return "outline"
  }
}

/**
 * Get human-readable text for distribution mode.
 */
export function getDistributionBadgeText(distribution: DistributionMode): string {
  switch (distribution) {
    case "single":
      return "Single Agent"
    case "swarm":
      return "Swarm"
    default:
      return distribution
  }
}

/**
 * Get badge variant for distribution mode.
 */
export function getDistributionBadgeVariant(distribution: DistributionMode): BadgeVariant {
  switch (distribution) {
    case "single":
      return "secondary"
    case "swarm":
      return "default"
    default:
      return "outline"
  }
}

/**
 * Get icon name for execution pattern.
 */
export function getPatternIcon(pattern: ExecutionPattern | null): string {
  if (!pattern) return "CircleIcon"
  switch (pattern) {
    case "sequential":
      return "ListIcon"
    case "tournament":
      return "TrophyIcon"
    case "cascade":
      return "Rows2Icon"
    default:
      return "CircleIcon"
  }
}
