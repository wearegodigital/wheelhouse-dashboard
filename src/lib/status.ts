import type { BadgeProps } from "@/components/ui/badge"

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
