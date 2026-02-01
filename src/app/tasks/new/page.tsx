"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageContainer } from "@/components/layout/PageContainer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useProjects } from "@/hooks/useProjects"
import { AddTaskChat } from "@/components/tasks/AddTaskChat"
import { FolderPlus, Layers, ListTodo, GitBranch } from "lucide-react"

type DecompositionLevel = "project" | "sprint" | "task"

interface TaskFormData {
  title: string
  description: string
  projectId: string | "new"
  newProjectName?: string
  newProjectRepo?: string
  decompositionLevel: DecompositionLevel
}

export default function AddTaskPage() {
  const router = useRouter()
  const { data: projects, isLoading: projectsLoading } = useProjects()

  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    projectId: "",
    decompositionLevel: "task",
  })
  const [showChat, setShowChat] = useState(false)
  const [chatInitialMessage, setChatInitialMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) return

    // Build the initial message for the orchestrator
    const levelDescriptions = {
      project: "as a full project with multiple sprints",
      sprint: "as a single sprint with multiple tasks",
      task: "as a single task",
    }

    let message = `I want to add: "${formData.title}"`

    if (formData.description) {
      message += `\n\nDescription: ${formData.description}`
    }

    message += `\n\nI'd like this decomposed ${levelDescriptions[formData.decompositionLevel]}.`

    if (formData.projectId === "new" && formData.newProjectName) {
      message += `\n\nThis should be part of a new project called "${formData.newProjectName}"`
      if (formData.newProjectRepo) {
        message += ` with repository: ${formData.newProjectRepo}`
      }
    } else if (formData.projectId && formData.projectId !== "new") {
      const project = projects?.find(p => p.id === formData.projectId)
      if (project) {
        message += `\n\nThis should be added to the existing project: "${project.name}"`
      }
    }

    message += "\n\nPlease analyze this and suggest an appropriate breakdown. If you think a different decomposition level would be more appropriate, please let me know."

    setChatInitialMessage(message)
    setShowChat(true)
  }

  const handleBack = () => {
    setShowChat(false)
  }

  if (showChat) {
    return (
      <PageContainer
        title="Plan Your Task"
        description="Discuss with the Orchestrator to refine your task breakdown"
        action={
          <Button variant="outline" onClick={handleBack}>
            Back to Form
          </Button>
        }
      >
        <AddTaskChat
          initialMessage={chatInitialMessage}
          projectId={formData.projectId !== "new" ? formData.projectId : undefined}
          suggestedLevel={formData.decompositionLevel}
          onComplete={() => router.push("/tasks")}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title="Add Task(s)"
      description="Describe what you want to build and choose how to break it down"
    >
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>What do you want to build?</CardTitle>
            <CardDescription>
              Describe your goal and the Orchestrator will help you plan the implementation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Add user authentication with OAuth"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe the feature, requirements, or any context that would help..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project</CardTitle>
            <CardDescription>
              Choose an existing project or create a new one.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <select
                id="project"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">{projectsLoading ? "Loading projects..." : "Select a project"}</option>
                <option value="new">+ Create new project</option>
                {projects?.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {formData.projectId === "new" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newProjectName">New Project Name</Label>
                  <Input
                    id="newProjectName"
                    placeholder="e.g., My App"
                    value={formData.newProjectName || ""}
                    onChange={(e) => setFormData({ ...formData, newProjectName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newProjectRepo">Repository URL (optional)</Label>
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newProjectRepo"
                      placeholder="https://github.com/username/repo"
                      value={formData.newProjectRepo || ""}
                      onChange={(e) => setFormData({ ...formData, newProjectRepo: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Decomposition Level</CardTitle>
            <CardDescription>
              How should this be broken down? The Orchestrator may suggest a different level if more appropriate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <DecompositionOption
                level="project"
                title="Full Project"
                description="Multiple sprints with many tasks. Best for large features or new systems."
                icon={<Layers className="h-5 w-5" />}
                selected={formData.decompositionLevel === "project"}
                onSelect={() => setFormData({ ...formData, decompositionLevel: "project" })}
              />
              <DecompositionOption
                level="sprint"
                title="Single Sprint"
                description="A focused set of related tasks. Best for medium features."
                icon={<ListTodo className="h-5 w-5" />}
                selected={formData.decompositionLevel === "sprint"}
                onSelect={() => setFormData({ ...formData, decompositionLevel: "sprint" })}
              />
              <DecompositionOption
                level="task"
                title="Single Task"
                description="One atomic unit of work. Best for small fixes or additions."
                icon={<GitBranch className="h-5 w-5" />}
                selected={formData.decompositionLevel === "task"}
                onSelect={() => setFormData({ ...formData, decompositionLevel: "task" })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={!formData.title.trim()}>
            Continue to Planning
          </Button>
        </div>
      </form>
    </PageContainer>
  )
}

interface DecompositionOptionProps {
  level: DecompositionLevel
  title: string
  description: string
  icon: React.ReactNode
  selected: boolean
  onSelect: () => void
}

function DecompositionOption({
  title,
  description,
  icon,
  selected,
  onSelect,
}: DecompositionOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`p-4 rounded-lg border-2 text-left transition-all ${
        selected
          ? "border-primary bg-primary/5"
          : "border-muted hover:border-muted-foreground/50"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={selected ? "text-primary" : "text-muted-foreground"}>
          {icon}
        </div>
        <span className="font-medium">{title}</span>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </button>
  )
}
