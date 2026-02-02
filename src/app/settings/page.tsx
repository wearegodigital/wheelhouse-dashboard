"use client"

import { useState, useEffect, useCallback } from "react"
import { PageContainer } from "@/components/layout/PageContainer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { Plus, Trash2, Copy, Check, Users, ChevronRight } from "lucide-react"
import Link from "next/link"

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  expires_at: string | null
  created_at: string
}

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null)

  const supabase = createClient()

  const loadUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }, [supabase.auth])

  const loadApiKeys = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("api_keys")
        .select("id, name, key_prefix, last_used_at, expires_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading API keys:", error)
      } else {
        setApiKeys(data || [])
      }
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadUser()
    loadApiKeys()
  }, [loadUser, loadApiKeys])

  async function createApiKey() {
    if (!newKeyName.trim() || !user) return

    try {
      // Generate a random UUID for the key
      const fullKey = `wh_${crypto.randomUUID().replace(/-/g, "")}`
      const keyPrefix = fullKey.substring(0, 12) + "..."

      // TODO: Generate proper types with `npx supabase gen types typescript`
      const { error } = await supabase.from("api_keys").insert({
        user_id: user.id,
        name: newKeyName.trim(),
        key_hash: fullKey, // In production, hash this
        key_prefix: keyPrefix,
        scopes: ["read", "write"],
      } as never)

      if (error) {
        console.error("Error creating API key:", error)
        alert("Failed to create API key")
      } else {
        setCreatedKey(fullKey)
        setNewKeyName("")
        setShowCreateForm(false)
        await loadApiKeys()
      }
    } catch (error) {
      console.error("Error creating API key:", error)
      alert("Failed to create API key")
    }
  }

  async function deleteApiKey(keyId: string) {
    if (!user) return
    if (!confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
      return
    }

    setDeletingKeyId(keyId)
    try {
      const { error } = await supabase
        .from("api_keys")
        .delete()
        .eq("id", keyId)
        .eq("user_id", user?.id)

      if (error) {
        console.error("Error deleting API key:", error)
        alert("Failed to delete API key")
      } else {
        await loadApiKeys()
      }
    } finally {
      setDeletingKeyId(null)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (!user) {
    return (
      <PageContainer title="Settings" description="Manage API keys and preferences">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Please sign in to manage API keys
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title="Settings"
      description="Manage API keys and preferences"
    >
      <div className="space-y-6">
        {/* Team Settings Link */}
        <Link href="/settings/team">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Team Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage team members, invites, and roles
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">API Keys</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Generate keys for CLI authentication
              </p>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </div>

          {/* Created Key Display */}
          {createdKey && (
            <Card className="mb-4 border-green-500">
              <CardHeader>
                <CardTitle className="text-lg">API Key Created</CardTitle>
                <CardDescription>
                  Copy this key now. You won&apos;t be able to see it again.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-muted rounded-md font-mono text-sm">
                    {createdKey}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(createdKey)}
                  >
                    {copiedKey ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="secondary"
                  className="mt-3"
                  onClick={() => setCreatedKey(null)}
                >
                  Done
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Create Form */}
          {showCreateForm && !createdKey && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">Create New API Key</CardTitle>
                <CardDescription>
                  Give your key a descriptive name
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Key name (e.g., 'Local Development')"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createApiKey()}
                  />
                  <Button onClick={createApiKey} disabled={!newKeyName.trim()}>
                    Create
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false)
                      setNewKeyName("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* API Keys List */}
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Loading API keys...
              </CardContent>
            </Card>
          ) : apiKeys.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No API keys yet. Create one to use with the wheelhouse CLI.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <Card key={key.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{key.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          <code className="bg-muted px-2 py-1 rounded">
                            {key.key_prefix}
                          </code>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                          <span>Created: {formatDate(key.created_at)}</span>
                          <span>Last used: {formatDate(key.last_used_at)}</span>
                          {key.expires_at && (
                            <span>Expires: {formatDate(key.expires_at)}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteApiKey(key.id)}
                        disabled={deletingKeyId === key.id}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageContainer>
  )
}
