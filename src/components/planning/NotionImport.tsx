"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Link2, Trash2, ExternalLink, Loader2 } from "lucide-react"

interface NotionImportProps {
  projectId: string
}

export function NotionImport({ projectId }: NotionImportProps) {
  const [notionPageId, setNotionPageId] = useState("")
  const [role, setRole] = useState<string>("source")
  const [isAdding, setIsAdding] = useState(false)
  const queryClient = useQueryClient()

  // Fetch existing links from Supabase
  const { data: links, isLoading } = useQuery({
    queryKey: ["project-notion-links", projectId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("project_notion_links" as unknown as string)
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
      if (error) throw error
      return (data || []) as unknown as Array<{
        id: string
        project_id: string
        notion_page_id: string
        role: string
        title: string
        url: string | null
        created_at: string
      }>
    },
  })

  // Add link mutation
  const addLink = useMutation({
    mutationFn: async () => {
      // Extract page ID from URL or use as-is
      let pageId = notionPageId.trim()
      // Handle full Notion URLs: extract the ID from the end
      const urlMatch = pageId.match(/([a-f0-9]{32})(?:\?|$)/i)
      if (urlMatch) {
        const raw = urlMatch[1]
        pageId = `${raw.slice(0,8)}-${raw.slice(8,12)}-${raw.slice(12,16)}-${raw.slice(16,20)}-${raw.slice(20)}`
      }

      // Fetch title from backend
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      let title = ""
      try {
        const resp = await fetch(`/api/notion/page-title?page_id=${pageId}`, {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        })
        const data = await resp.json()
        title = data.title || ""
      } catch { /* ignore */ }

      // Insert link directly to Supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped Supabase table
      const { data, error } = await (supabase as any)
        .from("project_notion_links")
        .insert({
          project_id: projectId,
          notion_page_id: pageId,
          role,
          title,
          url: `https://notion.so/${pageId.replace(/-/g, "")}`,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-notion-links", projectId] })
      setNotionPageId("")
      setIsAdding(false)
    },
  })

  // Remove link
  const removeLink = useMutation({
    mutationFn: async (linkId: string) => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped Supabase table
      await (supabase as any).from("project_notion_links").delete().eq("id", linkId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-notion-links", projectId] })
    },
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Linked Notion Pages
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsAdding(!isAdding)}>
            <Plus className="h-3 w-3 mr-1" /> Link Page
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isAdding && (
          <div className="p-3 border rounded-lg space-y-2">
            <Input
              value={notionPageId}
              onChange={(e) => setNotionPageId(e.target.value)}
              placeholder="Paste Notion page URL or ID..."
              onKeyDown={(e) => e.key === "Enter" && addLink.mutate()}
            />
            <div className="flex gap-2">
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="source">Source</SelectItem>
                  <SelectItem value="reference">Reference</SelectItem>
                  <SelectItem value="related">Related</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => addLink.mutate()} disabled={!notionPageId.trim() || addLink.isPending} size="sm">
                {addLink.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : links && links.length > 0 ? (
          <div className="space-y-2">
            {links.map((link) => (
              <div key={link.id} className="flex items-center justify-between p-2 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{link.role}</Badge>
                  <span className="text-sm font-medium">{link.title || link.notion_page_id.slice(0, 8)}</span>
                  {link.url && (
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeLink.mutate(link.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No Notion pages linked yet.</p>
        )}
      </CardContent>
    </Card>
  )
}
