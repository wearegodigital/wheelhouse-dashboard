"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, ExternalLink, Calendar, Clock, Tag, User } from "lucide-react"

interface NotionTaskAccordionProps {
  notionPageId: string
  defaultExpanded?: boolean
}

export function NotionTaskAccordion({ notionPageId, defaultExpanded = false }: NotionTaskAccordionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const { data: task, isLoading } = useQuery({
    queryKey: ["notion-task-detail", notionPageId],
    queryFn: async () => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("notion_tasks")
        .select("*")
        .eq("notion_page_id", notionPageId)
        .single()
      if (error) throw error
      return data as Record<string, unknown>
    },
    enabled: !!notionPageId,
  })

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="py-3">
          <div className="h-5 w-48 bg-muted rounded" />
        </CardHeader>
      </Card>
    )
  }

  if (!task) return null

  const notionUrl = `https://notion.so/${notionPageId.replace(/-/g, "")}`

  return (
    <Card className="border-dashed">
      <CardHeader className="py-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Notion</Badge>
            <span className="font-medium text-sm">{String(task.title ?? "Untitled Task")}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={notionUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-primary"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 pb-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {!!task.status && (
              <Badge variant={
                String(task.status) === "To Delegate" ? "default" :
                String(task.status) === "Delegated" ? "secondary" :
                String(task.status) === "Completed" ? "outline" : "default"
              }>
                {String(task.status)}
              </Badge>
            )}
            {!!task.priority && (
              <Badge variant={
                String(task.priority) === "High" ? "destructive" :
                String(task.priority) === "Medium" ? "default" : "secondary"
              }>
                {String(task.priority)}
              </Badge>
            )}
            {!!task.task_type && (
              <Badge variant="outline">
                <Tag className="h-3 w-3 mr-1" /> {String(task.task_type)}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            {!!task.client_name && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <User className="h-3 w-3" /> {String(task.client_name)}
              </div>
            )}
            {!!task.due_date && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" /> {String(task.due_date)}
              </div>
            )}
            {!!task.estimated_time && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" /> {String(task.estimated_time)}h estimated
              </div>
            )}
            {!!task.project_name && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Tag className="h-3 w-3" /> {String(task.project_name)}
              </div>
            )}
          </div>

          {!!task.synced_at && (
            <p className="text-xs text-muted-foreground">
              Last synced: {new Date(String(task.synced_at)).toLocaleString()}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  )
}
