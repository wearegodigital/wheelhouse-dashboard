"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { PageContainer } from "@/components/layout/PageContainer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useClient, useUpdateClient } from "@/hooks/useClients"
import { useRepos, useCreateRepo } from "@/hooks/useRepos"
import { useProjects } from "@/hooks/useProjects"
import {
  Building2,
  FolderGit2,
  Mail,
  Phone,
  ExternalLink,
  Pencil,
  Plus,
  X,
  Check,
  Layers,
  ChevronRight,
  Paperclip,
} from "lucide-react"
import { AttachmentUpload } from "@/components/attachments/AttachmentUpload"
import type { Client, Repo, ProjectSummary } from "@/lib/supabase/types"

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return <Badge variant="success">Active</Badge>
  if (status === "on_hold") return <Badge variant="warning">On Hold</Badge>
  if (status === "archived") return <Badge variant="outline">Archived</Badge>
  if (status === "draft") return <Badge variant="outline">Draft</Badge>
  if (status === "running") return <Badge variant="default">Running</Badge>
  if (status === "completed") return <Badge variant="success">Completed</Badge>
  if (status === "failed") return <Badge variant="destructive">Failed</Badge>
  if (status === "cancelled") return <Badge variant="outline">Cancelled</Badge>
  return <Badge variant="outline">{status}</Badge>
}

// ─── Client type badge ─────────────────────────────────────────────────────────

function ClientTypeBadge({ type }: { type: string }) {
  return (
    <Badge variant="secondary" className="capitalize">
      {type.replace(/_/g, " ")}
    </Badge>
  )
}

// ─── Loading skeleton ──────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Info card skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="h-5 bg-muted rounded w-32" />
            <div className="h-8 bg-muted rounded w-16" />
          </div>
          <div className="flex gap-2 mt-2">
            <div className="h-5 bg-muted rounded-full w-16" />
            <div className="h-5 bg-muted rounded-full w-24" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="h-4 bg-muted rounded w-48" />
          <div className="h-4 bg-muted rounded w-36" />
        </CardContent>
      </Card>
      {/* Section skeleton */}
      <div className="space-y-3">
        <div className="h-6 bg-muted rounded w-24" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-24">
              <CardContent className="pt-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Inline edit form ──────────────────────────────────────────────────────────

function EditClientForm({
  client,
  onCancel,
}: {
  client: Client
  onCancel: () => void
}) {
  const [name, setName] = useState(client.name)
  const [status, setStatus] = useState(client.status)
  const [clientType, setClientType] = useState(client.client_type)
  const [contactEmail, setContactEmail] = useState(client.contact_email ?? "")
  const [contactPhone, setContactPhone] = useState(client.contact_phone ?? "")
  const { mutate: updateClient, isPending } = useUpdateClient()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    updateClient(
      {
        id: client.id,
        name: name.trim(),
        status,
        client_type: clientType,
        contact_email: contactEmail.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined,
      },
      { onSuccess: onCancel }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-name">Name</Label>
          <Input
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="edit-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-type">Type</Label>
          <Select value={clientType} onValueChange={setClientType}>
            <SelectTrigger id="edit-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="agency">Agency</SelectItem>
              <SelectItem value="startup">Startup</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-email">Contact Email</Label>
          <Input
            id="edit-email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="contact@example.com"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-phone">Contact Phone</Label>
          <Input
            id="edit-phone"
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="+1 555 000 0000"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
          <X className="h-3.5 w-3.5 mr-1.5" />
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending || !name.trim()}>
          <Check className="h-3.5 w-3.5 mr-1.5" />
          {isPending ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}

// ─── Info card ─────────────────────────────────────────────────────────────────

function ClientInfoCard({ client }: { client: Client }) {
  const [editing, setEditing] = useState(false)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={client.status} />
            <ClientTypeBadge type={client.client_type} />
          </div>
          {!editing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              className="shrink-0"
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <EditClientForm client={client} onCancel={() => setEditing(false)} />
        ) : (
          <div className="space-y-2.5">
            {client.contact_email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <a
                  href={`mailto:${client.contact_email}`}
                  className="hover:text-foreground transition-colors"
                >
                  {client.contact_email}
                </a>
              </div>
            )}
            {client.contact_phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <a
                  href={`tel:${client.contact_phone}`}
                  className="hover:text-foreground transition-colors"
                >
                  {client.contact_phone}
                </a>
              </div>
            )}
            {!client.contact_email && !client.contact_phone && (
              <p className="text-sm text-muted-foreground italic">No contact info</p>
            )}
            {client.notion_id && (
              <div className="pt-1">
                <a
                  href={`https://notion.so/${client.notion_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View in Notion
                </a>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Add repo dialog ───────────────────────────────────────────────────────────

function AddRepoDialog({
  clientId,
  open,
  onOpenChange,
}: {
  clientId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [name, setName] = useState("")
  const [githubOrg, setGithubOrg] = useState("")
  const [githubRepo, setGithubRepo] = useState("")
  const { mutate: createRepo, isPending } = useCreateRepo()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createRepo(
      {
        name: name.trim(),
        client_id: clientId,
        github_org: githubOrg.trim() || undefined,
        github_repo: githubRepo.trim() || undefined,
      },
      {
        onSuccess: () => {
          setName("")
          setGithubOrg("")
          setGithubRepo("")
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Repo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="repo-name">Name</Label>
            <Input
              id="repo-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-app"
              autoFocus
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="repo-org">GitHub Org</Label>
            <Input
              id="repo-org"
              value={githubOrg}
              onChange={(e) => setGithubOrg(e.target.value)}
              placeholder="acme-corp"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="repo-repo">GitHub Repo</Label>
            <Input
              id="repo-repo"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              placeholder="my-app"
            />
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? "Adding…" : "Add Repo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Repo card ─────────────────────────────────────────────────────────────────

function RepoCard({ repo }: { repo: Repo }) {
  const slug = repo.github_org && repo.github_repo
    ? `${repo.github_org}/${repo.github_repo}`
    : repo.github_org || repo.github_repo || null

  return (
    <Link href={`/repos/${repo.id}`} className="block group">
      <Card className="h-full hover:shadow-md transition-shadow duration-200 group-hover:border-primary/40">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-2">
            <FolderGit2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <CardTitle className="text-sm font-semibold leading-snug line-clamp-1">
              {repo.name}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {slug ? (
              <span className="text-xs text-muted-foreground font-mono truncate">{slug}</span>
            ) : (
              <span className="text-xs text-muted-foreground italic">No GitHub info</span>
            )}
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 ml-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// ─── Project card ──────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <Link href={`/projects/${project.id}`} className="block group">
      <Card className="h-full hover:shadow-md transition-shadow duration-200 group-hover:border-primary/40">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-2">
            <Layers className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <CardTitle className="text-sm font-semibold leading-snug line-clamp-2">
              {project.name}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <StatusBadge status={project.status} />
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 ml-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// ─── Section header ────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  count,
  action,
}: {
  title: string
  count?: number
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {count != null && (
          <span className="text-sm text-muted-foreground">({count})</span>
        )}
      </div>
      {action}
    </div>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, message, action }: {
  icon: React.ElementType
  message: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed rounded-lg">
      <Icon className="h-8 w-8 text-muted-foreground/40 mb-3" />
      <p className="text-sm text-muted-foreground mb-3">{message}</p>
      {action}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [addRepoOpen, setAddRepoOpen] = useState(false)

  const { data: client, isLoading: clientLoading, error: clientError } = useClient(id)
  const { data: repos, isLoading: reposLoading } = useRepos({ client_id: id })
  const { data: projects, isLoading: projectsLoading } = useProjects({ client_id: id })

  if (clientLoading) {
    return (
      <PageContainer title="Client">
        <DetailSkeleton />
      </PageContainer>
    )
  }

  if (clientError || !client) {
    return (
      <PageContainer title="Client">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground text-sm">
            {clientError ? "Failed to load client." : "Client not found."}
          </p>
          <Link href="/clients">
            <Button variant="outline" size="sm" className="mt-4">
              Back to Clients
            </Button>
          </Link>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title={client.name}
      action={
        <Link href="/clients">
          <Button variant="outline" size="sm">
            All Clients
          </Button>
        </Link>
      }
    >
      <div className="space-y-8">
        {/* Info card */}
        <ClientInfoCard client={client} />

        {/* Repos section */}
        <section>
          <SectionHeader
            title="Repos"
            count={repos?.length}
            action={
              <Button size="sm" variant="outline" onClick={() => setAddRepoOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Repo
              </Button>
            }
          />
          {reposLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse h-20">
                  <CardContent className="pt-4">
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : repos && repos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {repos.map((repo) => (
                <RepoCard key={repo.id} repo={repo} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FolderGit2}
              message="No repos yet"
              action={
                <Button size="sm" variant="outline" onClick={() => setAddRepoOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Repo
                </Button>
              }
            />
          )}
        </section>

        {/* Projects section */}
        <section>
          <SectionHeader
            title="Projects"
            count={projects?.length}
            action={
              <Link href={`/projects/new?client_id=${id}`}>
                <Button size="sm" variant="outline">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Project
                </Button>
              </Link>
            }
          />
          {projectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse h-24">
                  <CardContent className="pt-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Layers}
              message="No projects yet"
              action={
                <Link href={`/projects/new?client_id=${id}`}>
                  <Button size="sm" variant="outline">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add Project
                  </Button>
                </Link>
              }
            />
          )}
        </section>

        {/* Attachments section */}
        <section>
          <SectionHeader
            title="Attachments"
            action={
              <Paperclip className="h-4 w-4 text-muted-foreground" />
            }
          />
          <div className="mt-1">
            <AttachmentUpload parentType="client" parentId={id as string} />
          </div>
        </section>
      </div>

      <AddRepoDialog
        clientId={id}
        open={addRepoOpen}
        onOpenChange={setAddRepoOpen}
      />
    </PageContainer>
  )
}
