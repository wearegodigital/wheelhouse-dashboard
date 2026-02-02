import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/providers/ToastProvider"
import type { TaskStatus } from "@/lib/supabase/types"

interface TaskUpdate {
  id: string
  description: string
  status: TaskStatus
  pr_url?: string | null
  error?: string | null
}

/**
 * Hook to show toast notifications for task status changes.
 * Subscribes to real-time task updates and shows appropriate notifications.
 */
export function useTaskNotifications() {
  const { addToast } = useToast()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("task_notifications")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tasks",
        },
        (payload) => {
          const task = payload.new as TaskUpdate
          const oldTask = payload.old as TaskUpdate

          // Only notify on status changes
          if (task.status === oldTask.status) return

          const taskName = task.description?.slice(0, 50) || `Task ${task.id.slice(0, 8)}`

          switch (task.status) {
            case "running":
              addToast(`Started: ${taskName}`, "info")
              break
            case "completed":
              if (task.pr_url) {
                addToast(`Completed: ${taskName} - PR created!`, "success")
              } else {
                addToast(`Completed: ${taskName}`, "success")
              }
              break
            case "failed":
              addToast(`Failed: ${taskName}${task.error ? ` - ${task.error}` : ""}`, "error")
              break
            case "cancelled":
              addToast(`Cancelled: ${taskName}`, "info")
              break
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [addToast])
}
