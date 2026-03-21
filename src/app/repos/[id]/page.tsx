"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ExternalLink, GitBranch, Pencil, Plus, X, Check, Loader2 } from "lucide-react"
import { PageContainer } from "@/components/layout/PageContainer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast"
import { useRepo, useUpdateRepo } from "@/hooks/useRepos"
import { useProjects } from "@/hooks/useProjects"
import { getStatusBadgeVariant } from "@/lib/status"
import { GitHubRepoPicker, GitHubRepoSelection } from "@/components/repos/GitHubRepoPicker"
import Link from "next/link"

interface EditFormData {
  name: string
  description: string
  github_org: string
  github_repo: string
  default_branch: string
}

export default function RepoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: repo, isLoading, error } = useRepo(id)
  const { data: allProjects } = useProjects({ repo_id: id })
  const updateRepo = useUpdateRepo()
  const { addToast } = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<EditFormData>({
    name: "",
    description: "",
    github_org: "",
    github_repo: "",
    default_branch: "",
  })

  const projects = allProjects ?? []

  const handleEditOpen = () => {
    if (!repo) return
    setEditForm({
      name: repo.name,
      description: repo.description ?? "",
      github_org: repo.github_org ?? "",
      github_repo: repo.github_repo ?? "",
      default_branch: repo.default_branch ?? "main",
    })
    setIsEditing(true)
  }

  const handleEditCancel = () => {
    setIsEditing(false)
  }

  const handleEditSave = async () => {
    if (!repo) return
    await updateRepo.mutateAsync({
      id: repo.id,
      name: editForm.name,
      description: editForm.description,
      github_org: editForm.github_org,
      github_repo: editForm.github_repo,
      default_branch: editForm.default_branch,
    })
    setIsEditing(false)
  }

  const handleGitHubSelect = async (selection: GitHubRepoSelection) => {
    if (!repo) return
    try {
      await updateRepo.mutateAsync({
        id: repo.id,
        github_org: selection.org,
        github_repo: selection.repo,
        repo_url: selection.repoUrl,
        default_branch: selection.branch || selection.defaultBranch || "main",
      })
      addToast("Repository linked to GitHub", "success")
    } catch {
      addToast("Failed to link repository to GitHub", "error")
    }
  }

  const githubUrl =
    repo?.github_org && repo?.github_repo
      ? `https://github.com/${repo.github_org}/${repo.github_repo}`
      : null

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading repo…
        </div>
      </PageContainer>
    )
  }

  if (error || !repo) {
    return (
      <PageContainer title="Repo not found">
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Repository not found."}
        </div>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.back()}>
            Go back
          </Button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title={repo.name}
      description={repo.description || undefined}
      action={
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditCancel}
                disabled={updateRepo.isPending}
              >
                <X className="mr-1.5 h-4 w-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleEditSave}
                disabled={updateRepo.isPending}
              >
                {updateRepo.isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-1.5 h-4 w-4" />
                )}
                Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handleEditOpen}>
                <Pencil className="mr-1.5 h-4 w-4" />
                Edit
              </Button>
              <Link href={`/projects/new?repo_id=${repo.id}`}>
                <Button size="sm">
                  <Plus className="mr-1.5 h-4 w-4" />
                  New Project
                </Button>
              </Link>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Edit form */}
        {isEditing && (
          <Card>
            <CardHeader>
              <CardTitle>Edit Repository</CardTitle>
              <CardDescription>Update the repository details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="my-repo"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Short description…"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-github-org">GitHub Org / User</Label>
                  <Input
                    id="edit-github-org"
                    value={editForm.github_org}
                    onChange={(e) => setEditForm({ ...editForm, github_org: e.target.value })}
                    placeholder="acme-corp"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-github-repo">GitHub Repo</Label>
                  <Input
                    id="edit-github-repo"
                    value={editForm.github_repo}
                    onChange={(e) => setEditForm({ ...editForm, github_repo: e.target.value })}
                    placeholder="my-service"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-default-branch">Default Branch</Label>
                  <Input
                    id="edit-default-branch"
                    value={editForm.default_branch}
                    onChange={(e) => setEditForm({ ...editForm, default_branch: e.target.value })}
                    placeholder="main"
                  />
                </div>
              </div>
              {updateRepo.isError && (
                <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  Failed to save: {(updateRepo.error as Error).message}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Info section */}
        <Card>
          <CardHeader>
            <CardTitle>Repository Details</CardTitle>
            <CardDescription>GitHub identity and configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* org/repo slug */}
            {(repo.github_org || repo.github_repo) && (
              <div className="flex items-center gap-2 text-sm">
                <GitBranch className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-mono text-foreground">
                  {repo.github_org}/{repo.github_repo}
                </span>
                {githubUrl && (
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 inline-flex items-center gap-1 text-primary hover:underline"
                    aria-label="View on GitHub"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    GitHub
                  </a>
                )}
              </div>
            )}

            {/* default branch badge */}
            {repo.default_branch && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GitBranch className="h-4 w-4 shrink-0" />
                <span>Default branch</span>
                <Badge variant="secondary" className="font-mono text-xs">
                  {repo.default_branch}
                </Badge>
              </div>
            )}

            {/* description */}
            {repo.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{repo.description}</p>
            )}
          </CardContent>
        </Card>

        {/* GitHub picker */}
        {!isEditing && (
          <Card>
            <CardHeader>
              <CardTitle>Link to GitHub</CardTitle>
              <CardDescription>Select an org, repo, and branch to auto-save the GitHub connection</CardDescription>
            </CardHeader>
            <CardContent>
              <GitHubRepoPicker
                onSelect={handleGitHubSelect}
                initialOrg={repo.github_org ?? undefined}
                initialRepo={repo.github_repo ?? undefined}
              />
            </CardContent>
          </Card>
        )}

        {/* Projects section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Projects</h2>
            <span className="text-sm text-muted-foreground">{projects.length} total</span>
          </div>

          {projects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  No projects yet for this repository.
                </p>
                <Link href={`/projects/new?repo_id=${repo.id}`}>
                  <Button variant="outline" size="sm">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Create first project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`} className="block group">
                  <Card className="h-full transition-colors hover:border-primary/50 hover:bg-muted/30">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors">
                          {project.name}
                        </CardTitle>
                        <Badge variant={getStatusBadgeVariant(project.status)} className="shrink-0 text-xs">
                          {project.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    {project.description && (
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
