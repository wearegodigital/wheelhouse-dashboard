"use client"

import { useState } from "react"
import { CheckCircle2, Zap } from "lucide-react"
import type { BlockerListItem } from "@/contract/wheelhouse-contract"
import { cn } from "@/lib/utils"
import { useResolveBlocker } from "@/hooks/useBlockers"

interface BlockerResolutionFormProps {
  blocker: BlockerListItem
  onResolved?: () => void
}

export function BlockerResolutionForm({ blocker, onResolved }: BlockerResolutionFormProps) {
  const [value, setValue] = useState("")
  const [resolved, setResolved] = useState(false)
  const [autoResumed, setAutoResumed] = useState(false)
  const resolve = useResolveBlocker()

  const schema = blocker.input_schema
  const inputType = schema?.type ?? "text"
  const label = schema?.label ?? "Response"
  const description = schema?.description
  const options = schema?.options

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return

    try {
      const result = await resolve.mutateAsync({ blockerId: blocker.id, resolution: value })
      setAutoResumed(!!result.auto_resumed)
      setResolved(true)
      // Brief success flash before collapsing
      setTimeout(() => {
        onResolved?.()
      }, 1800)
    } catch {
      // Error state is shown via resolve.isError
    }
  }

  // Success state
  if (resolved) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-green-500 [.cyberpunk_&]:text-success [.cyberpunk_&]:drop-shadow-[0_0_6px_hsl(var(--success)/0.6)]">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span>Resolved</span>
        {autoResumed && (
          <span className="inline-flex items-center gap-1 ml-1 text-xs text-muted-foreground">
            <Zap className="h-3 w-3 text-warning [.cyberpunk_&]:drop-shadow-[0_0_4px_hsl(var(--warning)/0.7)]" />
            task auto-resumed
          </span>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Label + description */}
      <div>
        <p className="text-xs font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>

      {/* Input varies by type */}
      {inputType === "choice" && options ? (
        <div className="space-y-2">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="radio"
                name={`blocker-${blocker.id}`}
                value={opt}
                checked={value === opt}
                onChange={() => setValue(opt)}
                className="accent-warning h-3.5 w-3.5"
              />
              <span className={cn(
                "text-sm transition-colors",
                value === opt ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
              )}>
                {opt}
              </span>
            </label>
          ))}
        </div>
      ) : inputType === "secret" ? (
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}…`}
          className={cn(
            "w-full px-3 py-2 text-sm rounded border bg-secondary text-foreground",
            "border-border placeholder:text-muted-foreground",
            "focus:outline-none focus:border-warning/60",
            "[.cyberpunk_&]:focus:shadow-[0_0_6px_hsl(var(--warning)/0.4)]",
            "transition-colors font-mono",
          )}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}…`}
          rows={3}
          className={cn(
            "w-full px-3 py-2 text-sm rounded border bg-secondary text-foreground",
            "border-border placeholder:text-muted-foreground",
            "focus:outline-none focus:border-warning/60",
            "[.cyberpunk_&]:focus:shadow-[0_0_6px_hsl(var(--warning)/0.4)]",
            "transition-colors resize-none",
          )}
        />
      )}

      {/* Error feedback */}
      {resolve.isError && (
        <p className="text-xs text-destructive">
          Failed to submit — please try again.
        </p>
      )}

      <button
        type="submit"
        disabled={!value.trim() || resolve.isPending}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-all",
          "bg-warning text-warning-foreground hover:bg-warning/90",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "[.cyberpunk_&]:shadow-glow [.cyberpunk_&]:hover:shadow-glow-lg",
        )}
      >
        {resolve.isPending ? "Submitting…" : "Submit Resolution"}
      </button>
    </form>
  )
}
