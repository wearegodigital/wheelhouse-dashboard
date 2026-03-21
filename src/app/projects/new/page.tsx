"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { PageContainer } from "@/components/layout/PageContainer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createProject } from "@/lib/api/wheelhouse"
import { useRepos } from "@/hooks/useRepos"

interface ProjectFormData {
  name: string
  description: string
  repo_id: string
  default_branch: string
}

export default function NewProjectPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><span className="text-muted-foreground">Loading...</span></div>}>
      <NewProjectForm />
    </Suspense>
  )
}

function NewProjectForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientId = searchParams.get("client_id") ?? undefined
  const initialRepoId = searchParams.get("repo_id") ?? ""

  const { data: repos = [] } = useRepos(clientId ? { client_id: clientId } : undefined)

  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    repo_id: initialRepoId,
    default_branch: "main",
  })

  const [errors, setErrors] = useState<Partial<Record<keyof ProjectFormData, string>>>({})

  // When repos load, pre-select repo from query param and auto-fill branch
  useEffect(() => {
    if (initialRepoId && repos.length > 0) {
      const repo = repos.find((r) => r.id === initialRepoId)
      if (repo) {
        setFormData((prev) => ({
          ...prev,
          repo_id: repo.id,
          default_branch: repo.default_branch || "main",
        }))
      }
    }
  }, [initialRepoId, repos])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProjectFormData, string>> = {}
    if (!formData.name.trim()) newErrors.name = "Name is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const result = await createProject({
        name: data.name,
        description: data.description || undefined,
        repo_id: data.repo_id || undefined,
        default_branch: data.default_branch || undefined,
        client_id: clientId,
      })
      if (!result.success) throw new Error(result.message || "Failed to create project")
      return result as { success: boolean; id: string }
    },
    onSuccess: (result) => {
      router.push(`/projects/${result.id}`)
    },
  })

  const handleRepoChange = (repoId: string) => {
    const repo = repos.find((r) => r.id === repoId)
    setFormData((prev) => ({
      ...prev,
      repo_id: repoId,
      default_branch: repo?.default_branch || prev.default_branch,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    createProjectMutation.mutate(formData)
  }

  return (
    <PageContainer
      title="New Project"
      description="Create a new project to start planning and execution"
    >
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Enter the details for your new project. You&apos;ll be able to start planning after creation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Auth System Overhaul"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Complete overhaul of authentication system with OAuth2 support..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              {/* Repository */}
              <div className="space-y-2">
                <Label htmlFor="repo_id">Repository</Label>
                <Select value={formData.repo_id} onValueChange={handleRepoChange}>
                  <SelectTrigger id="repo_id">
                    <SelectValue placeholder={repos.length === 0 ? "No repos available" : "Select a repository"} />
                  </SelectTrigger>
                  <SelectContent>
                    {repos.map((repo) => (
                      <SelectItem key={repo.id} value={repo.id}>
                        {repo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Default Branch */}
              <div className="space-y-2">
                <Label htmlFor="default_branch">Default Branch</Label>
                <Input
                  id="default_branch"
                  type="text"
                  placeholder="main"
                  value={formData.default_branch}
                  onChange={(e) => setFormData({ ...formData, default_branch: e.target.value })}
                />
              </div>

              {createProjectMutation.isError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  Failed to create project: {(createProjectMutation.error as Error).message}
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/projects")}
                  disabled={createProjectMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createProjectMutation.isPending}>
                  {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
