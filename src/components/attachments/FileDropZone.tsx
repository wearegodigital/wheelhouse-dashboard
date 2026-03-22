"use client"

import * as React from "react"
import { Upload } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { CyberCorners } from "@/components/ui/cyber-corners"
import { cn } from "@/lib/utils"

export interface UploadedFile {
  storagePath: string
  publicUrl: string
  fileName: string
  mimeType: string
  sizeBytes: number
}

interface FileDropZoneProps {
  onUpload: (file: UploadedFile) => void
  maxSize?: number        // bytes, default 10MB
  accept?: string         // MIME types, e.g. "image/*,application/pdf"
  bucketName?: string
  disabled?: boolean
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024 // 10MB
const DEFAULT_ACCEPT = "image/*,application/pdf,.txt,.md,.csv,.json"
const DEFAULT_BUCKET = "context-attachments"

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileDropZone({
  onUpload,
  maxSize = DEFAULT_MAX_SIZE,
  accept = DEFAULT_ACCEPT,
  bucketName = DEFAULT_BUCKET,
  disabled = false,
}: FileDropZoneProps) {
  const [dragOver, setDragOver] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    if (file.size > maxSize) {
      setError(`File exceeds ${formatSize(maxSize)} limit.`)
      return null
    }

    const supabase = createClient()
    const ext = file.name.split(".").pop() ?? "bin"
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    setProgress(10)

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(path, file, { contentType: file.type })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      setError(uploadError.message)
      return null
    }

    setProgress(90)

    const { data } = supabase.storage.from(bucketName).getPublicUrl(path)

    setProgress(100)

    return {
      storagePath: path,
      publicUrl: data.publicUrl,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
    }
  }

  const handleFiles = async (files: FileList | File[]) => {
    const file = Array.from(files)[0]
    if (!file) return

    setError(null)
    setUploading(true)
    setProgress(0)

    try {
      const result = await uploadFile(file)
      if (result) {
        onUpload(result)
      }
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setDragOver(true)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (!disabled && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-6 py-7 transition-all duration-200",
          "text-muted-foreground",
          "[.cyberpunk_&]:rounded-none",
          dragOver
            ? "border-primary bg-primary/5 text-primary [.cyberpunk_&]:shadow-[0_0_12px_hsl(var(--primary)/0.4),inset_0_0_12px_hsl(var(--primary)/0.08)]"
            : "border-border hover:border-primary/50 [.cyberpunk_&]:border-primary/30 [.cyberpunk_&]:hover:border-primary/60 [.cyberpunk_&]:hover:shadow-[0_0_8px_hsl(var(--primary)/0.2)]",
          (disabled || uploading) && "pointer-events-none opacity-50"
        )}
      >
        <CyberCorners
          size="sm"
          className={cn(
            "transition-colors duration-200",
            dragOver ? "text-primary" : "text-primary/40"
          )}
        />

        {uploading ? (
          <div className="flex w-full flex-col items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent [.cyberpunk_&]:drop-shadow-[0_0_6px_hsl(var(--primary))]" />
            <div className="w-full max-w-[160px] space-y-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted [.cyberpunk_&]:rounded-none">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300 [.cyberpunk_&]:rounded-none [.cyberpunk_&]:shadow-[0_0_6px_hsl(var(--primary))]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-[11px] text-muted-foreground">
                Uploading…
              </p>
            </div>
          </div>
        ) : (
          <>
            <Upload
              className={cn(
                "h-7 w-7 transition-colors duration-200",
                dragOver
                  ? "text-primary [.cyberpunk_&]:drop-shadow-[0_0_6px_hsl(var(--primary))]"
                  : "text-muted-foreground"
              )}
            />
            <div className="text-center">
              <p className="text-sm">
                Drop a file or{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary underline-offset-2 hover:underline [.cyberpunk_&]:drop-shadow-[0_0_4px_hsl(var(--primary)/0.6)] focus-visible:outline-none"
                >
                  browse
                </button>
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Max {formatSize(maxSize)} — images, PDFs, text files
              </p>
            </div>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(e.target.files)
              e.target.value = ""
            }
          }}
        />
      </div>

      {error && (
        <p className="text-xs text-destructive [.cyberpunk_&]:drop-shadow-[0_0_4px_hsl(var(--destructive)/0.6)]">
          {error}
        </p>
      )}
    </div>
  )
}
