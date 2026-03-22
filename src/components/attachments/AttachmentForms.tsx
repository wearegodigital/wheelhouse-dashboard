"use client"

import * as React from "react"
import { Link, FileText, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type AttachmentFormType = "url" | "notion" | "note"

export interface AttachmentFormData {
  type: AttachmentFormType
  title: string
  description: string
  url?: string
  notion_page_id?: string
}

interface AttachmentFormsProps {
  onSubmit: (data: AttachmentFormData) => Promise<void>
  submitting?: boolean
}

const FORM_TYPES: { value: AttachmentFormType; label: string; icon: React.ReactNode }[] = [
  { value: "url",    label: "URL",         icon: <Link className="h-3.5 w-3.5" /> },
  { value: "notion", label: "Notion link", icon: <BookOpen className="h-3.5 w-3.5" /> },
  { value: "note",   label: "Text note",   icon: <FileText className="h-3.5 w-3.5" /> },
]

export function AttachmentForms({ onSubmit, submitting = false }: AttachmentFormsProps) {
  const [activeType, setActiveType] = React.useState<AttachmentFormType>("url")
  const [title, setTitle] = React.useState("")
  const [url, setUrl] = React.useState("")
  const [notionPageId, setNotionPageId] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  const resetForm = () => {
    setTitle("")
    setUrl("")
    setNotionPageId("")
    setDescription("")
    setError(null)
  }

  const handleTypeChange = (type: AttachmentFormType) => {
    setActiveType(type)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError("Title is required.")
      return
    }

    if (activeType === "url" && !url.trim()) {
      setError("URL is required.")
      return
    }

    if (activeType === "notion" && !notionPageId.trim()) {
      setError("Notion page ID is required.")
      return
    }

    try {
      await onSubmit({
        type: activeType,
        title: title.trim(),
        description: description.trim(),
        url: activeType === "url" ? url.trim() : undefined,
        notion_page_id: activeType === "notion" ? notionPageId.trim() : undefined,
      })
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add attachment.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Type selector */}
      <div className="flex gap-1 rounded-md bg-muted p-1 [.cyberpunk_&]:rounded-none">
        {FORM_TYPES.map(({ value, label, icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleTypeChange(value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-all duration-150",
              "[.cyberpunk_&]:rounded-none",
              activeType === value
                ? "bg-background text-foreground shadow-sm [.cyberpunk_&]:shadow-none [.cyberpunk_&]:border [.cyberpunk_&]:border-primary/40 [.cyberpunk_&]:text-primary [.cyberpunk_&]:drop-shadow-[0_0_4px_hsl(var(--primary)/0.4)]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Title */}
      <Input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={submitting}
        className="[.cyberpunk_&]:rounded-none"
      />

      {/* Type-specific fields */}
      {activeType === "url" && (
        <Input
          type="url"
          placeholder="https://…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={submitting}
          className="[.cyberpunk_&]:rounded-none"
        />
      )}

      {activeType === "notion" && (
        <Input
          placeholder="Notion page ID or URL"
          value={notionPageId}
          onChange={(e) => setNotionPageId(e.target.value)}
          disabled={submitting}
          className="font-mono text-xs [.cyberpunk_&]:rounded-none"
        />
      )}

      {/* Description / note body */}
      <textarea
        placeholder={activeType === "note" ? "Write your note…" : "Description (optional)"}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={submitting}
        rows={activeType === "note" ? 4 : 2}
        className={cn(
          "w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "[.cyberpunk_&]:rounded-none [.cyberpunk_&]:focus-visible:ring-primary/60"
        )}
      />

      {error && (
        <p className="text-xs text-destructive [.cyberpunk_&]:drop-shadow-[0_0_4px_hsl(var(--destructive)/0.6)]">
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="sm"
        disabled={submitting}
        className="w-full [.cyberpunk_&]:rounded-none"
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Adding…
          </span>
        ) : (
          "Add attachment"
        )}
      </Button>
    </form>
  )
}
