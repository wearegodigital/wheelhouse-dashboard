"use client"

import { useState } from "react"
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import type { BlockerListItem } from "@/contract/wheelhouse-contract"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useDismissBlocker } from "@/hooks/useBlockers"
import { BlockerResolutionForm } from "./BlockerResolutionForm"

interface BlockerCardProps {
  blocker: BlockerListItem
}

export function BlockerCard({ blocker }: BlockerCardProps) {
  const [expanded, setExpanded] = useState(false)
  const dismiss = useDismissBlocker()

  const handleDismiss = () => {
    if (confirm("Dismiss this blocker? The task will proceed without resolution.")) {
      dismiss.mutate(blocker.id)
    }
  }

  return (
    <Card className={cn(
      "transition-all duration-300",
      "[.cyberpunk_&]:hover:shadow-[0_0_10px_hsl(var(--warning)/0.3),inset_0_0_6px_hsl(var(--warning)/0.08)]",
      "[.cyberpunk_&]:hover:border-warning/40",
    )}>
      <CardContent className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Type + schema badges */}
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <Badge
                variant={blocker.blocker_type === "planned" ? "secondary" : "warning"}
                className="text-[10px] px-1.5 py-0 uppercase tracking-wider font-medium"
              >
                {blocker.blocker_type}
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 uppercase tracking-wider font-medium"
              >
                {blocker.input_schema?.type ?? "text"}
              </Badge>
            </div>

            {/* Title */}
            <p className="text-sm font-medium text-foreground leading-snug">
              {blocker.title}
            </p>

            {/* Description */}
            {blocker.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {blocker.description}
              </p>
            )}

            {/* Source error — truncated */}
            {blocker.source_error && (
              <div className="mt-2 flex items-start gap-1.5">
                <AlertCircle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground font-mono line-clamp-2 break-all">
                  {blocker.source_error}
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border transition-colors",
                "bg-warning/10 text-warning border-warning/30 hover:bg-warning/20",
                "[.cyberpunk_&]:shadow-[0_0_4px_hsl(var(--warning)/0.3)] [.cyberpunk_&]:hover:shadow-[0_0_8px_hsl(var(--warning)/0.5)]",
              )}
            >
              {expanded ? (
                <>Close <ChevronUp className="h-3 w-3" /></>
              ) : (
                <>Resolve <ChevronDown className="h-3 w-3" /></>
              )}
            </button>
            <button
              onClick={handleDismiss}
              disabled={dismiss.isPending}
              className="px-2.5 py-1 text-xs rounded border border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-border transition-colors disabled:opacity-50"
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Expandable resolution form */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-border">
            <BlockerResolutionForm
              blocker={blocker}
              onResolved={() => setExpanded(false)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
