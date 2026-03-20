import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { NotionTaskRow } from "@/lib/supabase/types"

export type NotionTask = NotionTaskRow

// Status shorthand → Notion status name
const STATUS_MAP: Record<string, string> = {
  to_delegate: "To Delegate",
  delegated: "Delegated",
  in_progress: "In Progress",
  to_review: "To Review",
  completed: "Completed",
}

export function useNotionTasks(status?: string) {
  return useQuery({
    queryKey: ["notion-tasks", status],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from("notion_tasks")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      if (status) {
        const notionStatus = STATUS_MAP[status] || status
        query = query.eq("status", notionStatus)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as NotionTask[]
    },
  })
}
