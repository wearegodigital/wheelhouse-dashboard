"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { PageContainer } from "@/components/layout/PageContainer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

interface ProjectFormData {
  name: string
  description: string
  repo_url: string
  default_branch: string
}

export default function NewProjectPage() {
  const router = useRouter()

  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    repo_url: "",
    default_branch: "main",
  })

  const [errors, setErrors] = useState<Partial<Record<keyof ProjectFormData, string>>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProjectFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.repo_url.trim()) {
      newErrors.repo_url = "Repository URL is required"
    } else if (!formData.repo_url.match(/^https?:\/\/.+/)) {
      newErrors.repo_url = "Must be a valid URL"
    }

    if (!formData.default_branch.trim()) {
      newErrors.default_branch = "Default branch is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const supabase = createClient()
      // TODO: Generate proper types with `npx supabase gen types typescript`
      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          name: data.name,
          description: data.description || "",
          repo_url: data.repo_url,
          default_branch: data.default_branch,
          status: "planning",
          metadata: {},
        } as never)
        .select()
        .single()

      if (error) throw error
      return project as { id: string }
    },
    onSuccess: (project) => {
      router.push(`/projects/${project.id}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    createProjectMutation.mutate(formData)
  }

  const handleCancel = () => {
    router.push("/projects")
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
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="repo_url">
                  Repository URL <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="repo_url"
                  type="text"
                  placeholder="https://github.com/owner/repo"
                  value={formData.repo_url}
                  onChange={(e) => setFormData({ ...formData, repo_url: e.target.value })}
                  className={errors.repo_url ? "border-destructive" : ""}
                />
                {errors.repo_url && (
                  <p className="text-sm text-destructive">{errors.repo_url}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_branch">Default Branch</Label>
                <Input
                  id="default_branch"
                  type="text"
                  placeholder="main"
                  value={formData.default_branch}
                  onChange={(e) => setFormData({ ...formData, default_branch: e.target.value })}
                  className={errors.default_branch ? "border-destructive" : ""}
                />
                {errors.default_branch && (
                  <p className="text-sm text-destructive">{errors.default_branch}</p>
                )}
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
                  onClick={handleCancel}
                  disabled={createProjectMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createProjectMutation.isPending}
                >
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
