"use client"

export function AttachmentUpload({ parentType, parentId }: { parentType: string; parentId: string }) {
  return <div className="text-muted-foreground text-sm p-4">Attachments for {parentType} {parentId} (coming soon)</div>
}
