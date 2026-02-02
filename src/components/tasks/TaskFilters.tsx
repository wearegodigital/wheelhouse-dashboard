"use client"

import { useState, useCallback } from "react"
import { useProjects } from "@/hooks/useProjects"
import { useSprints } from "@/hooks/useSprints"
import type { TaskFilters as TaskFiltersType } from "@/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X, SlidersHorizontal, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface TaskFiltersProps {
  filters: TaskFiltersType
  onFiltersChange: (filters: TaskFiltersType) => void
  className?: string
}

const TASK_STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "queued", label: "Queued" },
  { value: "running", label: "Running" },
  { value: "validating", label: "Validating" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
]

const SORT_OPTIONS = [
  { value: "created_at:desc", label: "Newest First" },
  { value: "created_at:asc", label: "Oldest First" },
  { value: "updated_at:desc", label: "Recently Updated" },
  { value: "status:asc", label: "Status (A-Z)" },
  { value: "progress:desc", label: "Progress (High to Low)" },
  { value: "progress:asc", label: "Progress (Low to High)" },
]

export function TaskFilters({
  filters,
  onFiltersChange,
  className,
}: TaskFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const { data: projects } = useProjects()
  const { data: sprints } = useSprints(filters.projectId || "")

  const updateFilter = useCallback(
    (key: keyof TaskFiltersType, value: string | undefined) => {
      const newFilters: TaskFiltersType = { ...filters }
      if (value === undefined || value === "" || value === "all") {
        delete newFilters[key]
      } else {
        // Use type assertion since we know the value matches the key type
        ;(newFilters as Record<string, string>)[key] = value
      }
      // Reset sprint when project changes
      if (key === "projectId" && value !== filters.projectId) {
        delete newFilters.sprintId
      }
      onFiltersChange(newFilters)
    },
    [filters, onFiltersChange]
  )

  const handleSortChange = useCallback(
    (value: string) => {
      const [sortBy, sortOrder] = value.split(":") as [
        TaskFiltersType["sortBy"],
        TaskFiltersType["sortOrder"]
      ]
      onFiltersChange({
        ...filters,
        sortBy,
        sortOrder,
      })
    },
    [filters, onFiltersChange]
  )

  const clearFilters = useCallback(() => {
    onFiltersChange({})
  }, [onFiltersChange])

  const hasActiveFilters =
    filters.status ||
    filters.projectId ||
    filters.sprintId ||
    filters.search ||
    filters.dateFrom ||
    filters.dateTo

  const currentSort = `${filters.sortBy || "created_at"}:${filters.sortOrder || "desc"}`

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main filters row */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={filters.search || ""}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status filter */}
        <Select
          value={filters.status || "all"}
          onValueChange={(value) => updateFilter("status", value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {TASK_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Project filter */}
        <Select
          value={filters.projectId || "all"}
          onValueChange={(value) => updateFilter("projectId", value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects?.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sprint filter (only when project selected) */}
        {filters.projectId && (
          <Select
            value={filters.sprintId || "all"}
            onValueChange={(value) => updateFilter("sprintId", value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sprint" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sprints</SelectItem>
              {sprints?.map((sprint) => (
                <SelectItem key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Sort */}
        <Select value={currentSort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced filters toggle */}
        <Button
          variant={showAdvanced ? "secondary" : "outline"}
          size="icon"
          onClick={() => setShowAdvanced(!showAdvanced)}
          title="Advanced filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced filters row */}
      {showAdvanced && (
        <div className="flex flex-wrap gap-3 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Created from:</span>
            <Input
              type="date"
              value={filters.dateFrom || ""}
              onChange={(e) => updateFilter("dateFrom", e.target.value)}
              className="w-[160px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">to:</span>
            <Input
              type="date"
              value={filters.dateTo || ""}
              onChange={(e) => updateFilter("dateTo", e.target.value)}
              className="w-[160px]"
            />
          </div>
        </div>
      )}

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.status && (
            <FilterBadge
              label={`Status: ${filters.status}`}
              onRemove={() => updateFilter("status", undefined)}
            />
          )}
          {filters.projectId && (
            <FilterBadge
              label={`Project: ${projects?.find((p) => p.id === filters.projectId)?.name || "..."}`}
              onRemove={() => updateFilter("projectId", undefined)}
            />
          )}
          {filters.sprintId && (
            <FilterBadge
              label={`Sprint: ${sprints?.find((s) => s.id === filters.sprintId)?.name || "..."}`}
              onRemove={() => updateFilter("sprintId", undefined)}
            />
          )}
          {filters.search && (
            <FilterBadge
              label={`Search: "${filters.search}"`}
              onRemove={() => updateFilter("search", undefined)}
            />
          )}
          {filters.dateFrom && (
            <FilterBadge
              label={`From: ${filters.dateFrom}`}
              onRemove={() => updateFilter("dateFrom", undefined)}
            />
          )}
          {filters.dateTo && (
            <FilterBadge
              label={`To: ${filters.dateTo}`}
              onRemove={() => updateFilter("dateTo", undefined)}
            />
          )}
        </div>
      )}
    </div>
  )
}

function FilterBadge({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-md">
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-primary/20 rounded-full p-0.5"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}
