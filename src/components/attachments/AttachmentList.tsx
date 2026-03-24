"use client"

import * as React from "react"
import {
  Paperclip,
  Link,
  FileText,
  BookOpen,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  File,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { ContextAttachment } from "@/lib/supabase/types"

type ParentType = "job" | "sprint" | "task"

interface AttachmentListProps {
  parentType: ParentType
  parentId: string
}

const PARENT_COLUMN: Record<ParentType, string> = {
  job:    "job_id",
  sprint: "sprint_id",
  task:   "task_id",
}

function formatSize(bytes: number | null): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function AttachmentTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "url":    return <Link className="h-4 w-4 shrink-0 text-blue-500" />
    case "notion": return <BookOpen className="h-4 w-4 shrink-0 text-orange-400" />
    case "note":   return <FileText className="h-4 w-4 shrink-0 text-emerald-500" />
    case "file":   return <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
    default:       return <File className="h-4 w-4 shrink-0 text-muted-foreground" />
  }
}

function AttachmentTypeBadge({ type }: { type: string }) {
  const variants: Record<string, string> = {
    url:    "bg-blue-500/10 text-blue-600 border-blue-500/20",
    notion: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    note:   "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    file:   "bg-muted text-muted-foreground border-border",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide",
        "[.cyberpunk_&]:rounded-none",
        variants[type] ?? variants.file
      )}
    >
      {type}
    </span>
  )
}

function AttachmentItem({
  attachment,
  onDelete,
  deleting,
}: {
  attachment: ContextAttachment
  onDelete: (id: string) => void
  deleting: boolean
}) {
  const [summaryOpen, setSummaryOpen] = React.useState(false)
  const hasSummary = !!attachment.ai_context_summary
  const hasLink = !!(attachment.url)

  return (
    <div
      className={cn(
        "group rounded-md border border-border bg-card p-3 transition-colors duration-150",
        "hover:border-border/80 hover:bg-card/80",
        "[.cyberpunk_&]:rounded-none [.cyberpunk_&]:border-primary/20 [.cyberpunk_&]:hover:border-primary/40",
        deleting && "opacity-50 pointer-events-none"
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5">
          <AttachmentTypeIcon type={attachment.type} />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          {/* Title row */}
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium leading-tight">
              {attachment.title || "Untitled"}
            </span>
            <AttachmentTypeBadge type={attachment.type} />
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {attachment.mime_type && (
              <span className="font-mono">{attachment.mime_type}</span>
            )}
            {attachment.file_size_bytes != null && (
              <span>{formatSize(attachment.file_size_bytes)}</span>
            )}
            {hasLink && (
              <a
                href={attachment.url!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 text-primary hover:underline [.cyberpunk_&]:drop-shadow-[0_0_4px_hsl(var(--primary)/0.5)]"
              >
                <span className="truncate max-w-[160px]">{attachment.url}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            )}
            {attachment.notion_page_id && (
              <span className="font-mono text-[10px]">{attachment.notion_page_id}</span>
            )}
          </div>

          {/* Description */}
          {attachment.description && (
            <p className="text-xs text-muted-foreground/80 line-clamp-2">
              {attachment.description}
            </p>
          )}

          {/* AI summary toggle */}
          {hasSummary && (
            <div>
              <button
                type="button"
                onClick={() => setSummaryOpen((v) => !v)}
                className="flex items-center gap-1 text-[11px] text-primary hover:underline focus-visible:outline-none [.cyberpunk_&]:drop-shadow-[0_0_3px_hsl(var(--primary)/0.5)]"
              >
                {summaryOpen ? (
                  <><ChevronUp className="h-3 w-3" /> Hide AI summary</>
                ) : (
                  <><ChevronDown className="h-3 w-3" /> Show AI summary</>
                )}
              </button>
              {summaryOpen && (
                <p className="mt-1.5 rounded bg-muted/50 px-2 py-1.5 text-xs text-muted-foreground [.cyberpunk_&]:rounded-none [.cyberpunk_&]:border [.cyberpunk_&]:border-primary/10">
                  {attachment.ai_context_summary}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          type="button"
          onClick={() => onDelete(attachment.id)}
          aria-label="Remove attachment"
          className={cn(
            "shrink-0 rounded p-1 text-muted-foreground/40 opacity-0 transition-all duration-150",
            "hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100",
            "[.cyberpunk_&]:rounded-none [.cyberpunk_&]:hover:shadow-[0_0_6px_hsl(var(--destructive)/0.4)]"
          )}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export function AttachmentList({ parentType, parentId }: AttachmentListProps) {
  const queryClient = useQueryClient()
  const column = PARENT_COLUMN[parentType]
  const queryKey = ["attachments", parentType, parentId]

  const { data: attachments, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("context_attachments")
        .select("*")
        .eq(column, parentId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data as ContextAttachment[]
    },
    enabled: !!parentId,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from("context_attachments")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-md bg-muted [.cyberpunk_&]:rounded-none"
          />
        ))}
      </div>
    )
  }

  if (!attachments?.length) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No attachments yet.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <AttachmentItem
          key={attachment.id}
          attachment={attachment}
          onDelete={(id) => deleteMutation.mutate(id)}
          deleting={deleteMutation.isPending && deleteMutation.variables === attachment.id}
        />
      ))}
    </div>
  )
}
