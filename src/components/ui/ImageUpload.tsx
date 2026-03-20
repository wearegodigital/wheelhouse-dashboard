"use client"

import * as React from "react"
import { Upload, X, Image as ImageIcon, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { CyberCorners } from "@/components/ui/cyber-corners"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  onUpload: (urls: string[]) => void
  existingUrls?: string[]
  maxFiles?: number
  bucketName?: string
}

export function ImageUpload({
  onUpload,
  existingUrls = [],
  maxFiles = 10,
  bucketName = "task-images",
}: ImageUploadProps) {
  const [uploading, setUploading] = React.useState(false)
  const [uploadedUrls, setUploadedUrls] = React.useState<string[]>(existingUrls)
  const [dragOver, setDragOver] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File): Promise<string | null> => {
    const supabase = createClient()
    const path = `${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(path, file)

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return null
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(path)
    return data.publicUrl
  }

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const remaining = maxFiles - uploadedUrls.length
    if (remaining <= 0) {
      setError(`Maximum ${maxFiles} files allowed.`)
      return
    }
    const toUpload = fileArray.slice(0, remaining)
    setError(null)
    setUploading(true)

    try {
      const results = await Promise.all(toUpload.map(uploadFile))
      const newUrls = results.filter((url): url is string => url !== null)
      const allUrls = [...uploadedUrls, ...newUrls]
      setUploadedUrls(allUrls)
      onUpload(allUrls)
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    // Only clear if leaving the drop zone entirely (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handlePaste = React.useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      const files: File[] = []
      for (const item of Array.from(items)) {
        if (item.kind === "file") {
          const file = item.getAsFile()
          if (file) files.push(file)
        }
      }
      if (files.length > 0) {
        handleFiles(files)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uploadedUrls, maxFiles, bucketName]
  )

  React.useEffect(() => {
    document.addEventListener("paste", handlePaste)
    return () => document.removeEventListener("paste", handlePaste)
  }, [handlePaste])

  const removeUrl = (url: string) => {
    const updated = uploadedUrls.filter((u) => u !== url)
    setUploadedUrls(updated)
    onUpload(updated)
  }

  const isPdf = (url: string) =>
    url.toLowerCase().includes(".pdf") || url.toLowerCase().endsWith("pdf")

  const atCapacity = uploadedUrls.length >= maxFiles

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-6 py-8 transition-all duration-200",
          "text-muted-foreground",
          "[.cyberpunk_&]:rounded-none",
          dragOver
            ? "border-primary bg-primary/5 text-primary [.cyberpunk_&]:shadow-[0_0_12px_hsl(var(--primary)/0.4),inset_0_0_12px_hsl(var(--primary)/0.08)]"
            : "border-border hover:border-primary/50 [.cyberpunk_&]:border-primary/30 [.cyberpunk_&]:hover:border-primary/60 [.cyberpunk_&]:hover:shadow-[0_0_8px_hsl(var(--primary)/0.2)]",
          atCapacity && "pointer-events-none opacity-50"
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
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent [.cyberpunk_&]:drop-shadow-[0_0_6px_hsl(var(--primary))]" />
            <span className="text-xs">Uploading…</span>
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
                Drop files here or{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary underline-offset-2 hover:underline [.cyberpunk_&]:drop-shadow-[0_0_4px_hsl(var(--primary)/0.6)] focus-visible:outline-none"
                >
                  browse
                </button>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Images and PDFs — paste from clipboard supported
              </p>
              {maxFiles > 1 && (
                <p className="mt-0.5 text-xs text-muted-foreground/60">
                  {uploadedUrls.length}/{maxFiles} files
                </p>
              )}
            </div>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(e.target.files)
              // Reset so the same file can be re-selected
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

      {/* Preview grid */}
      {uploadedUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {uploadedUrls.map((url) => (
            <div
              key={url}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-md border border-border bg-muted",
                "[.cyberpunk_&]:rounded-none [.cyberpunk_&]:border-primary/20"
              )}
            >
              {isPdf(url) ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
                  <FileText className="h-6 w-6" />
                  <span className="max-w-full truncate px-1 text-[10px]">PDF</span>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt="Uploaded file"
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              )}

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeUrl(url)}
                aria-label="Remove file"
                className={cn(
                  "absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full",
                  "bg-background/80 text-foreground opacity-0 backdrop-blur-sm transition-opacity duration-150",
                  "hover:bg-destructive hover:text-destructive-foreground",
                  "group-hover:opacity-100",
                  "[.cyberpunk_&]:rounded-none [.cyberpunk_&]:hover:shadow-[0_0_6px_hsl(var(--destructive))]"
                )}
              >
                <X className="h-3 w-3" />
              </button>

              {/* Cyber corners on hover */}
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100 [.cyberpunk_&]:block hidden">
                <CyberCorners size="sm" className="text-primary" />
              </div>
            </div>
          ))}

          {/* Add more slot */}
          {!atCapacity && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "group flex aspect-square items-center justify-center rounded-md border-2 border-dashed border-border",
                "text-muted-foreground transition-all duration-200",
                "hover:border-primary/50 hover:text-primary",
                "[.cyberpunk_&]:rounded-none [.cyberpunk_&]:border-primary/20",
                "[.cyberpunk_&]:hover:border-primary/50 [.cyberpunk_&]:hover:shadow-[0_0_6px_hsl(var(--primary)/0.3)]"
              )}
            >
              <ImageIcon className="h-5 w-5 transition-colors duration-200 group-hover:text-primary" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
