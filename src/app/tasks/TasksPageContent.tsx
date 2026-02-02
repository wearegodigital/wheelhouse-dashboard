"use client"

import { useState } from "react"
import { TaskList, TaskFilters } from "@/components/tasks"
import type { TaskFilters as TaskFiltersType } from "@/types"

export function TasksPageContent() {
  const [filters, setFilters] = useState<TaskFiltersType>({})

  return (
    <div className="space-y-6">
      <TaskFilters filters={filters} onFiltersChange={setFilters} />
      <TaskList filters={filters} />
    </div>
  )
}
