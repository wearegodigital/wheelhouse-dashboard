import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const MODAL_API_URL = process.env.MODAL_API_URL || ""

type EntityType = "projects" | "sprints" | "tasks"

interface CreateProjectBody {
  name: string
  description?: string
  repo_url?: string
  default_branch?: string
}

interface CreateSprintBody {
  project_id: string
  name: string
  description?: string
  order_index?: number
}

interface CreateTaskBody {
  title: string
  description?: string
  repo_url: string
  sprint_id?: string
  project_id?: string
}

export async function POST(request: NextRequest) {
  if (!MODAL_API_URL) {
    console.error("MODAL_API_URL environment variable is not configured")
    return NextResponse.json(
      { success: false, message: "Server configuration error" },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const entityType = body.type as EntityType

    if (!entityType || !["projects", "sprints", "tasks"].includes(entityType)) {
      return NextResponse.json(
        { success: false, message: "Invalid or missing entity type" },
        { status: 400 }
      )
    }

    // Build the payload based on entity type
    let payload: CreateProjectBody | CreateSprintBody | CreateTaskBody

    switch (entityType) {
      case "projects":
        payload = {
          name: body.name,
          description: body.description || "",
          repo_url: body.repo_url || "",
        }
        break
      case "sprints":
        if (!body.project_id || !body.name) {
          return NextResponse.json(
            { success: false, message: "Sprint requires project_id and name" },
            { status: 400 }
          )
        }
        payload = {
          project_id: body.project_id,
          name: body.name,
          description: body.description || "",
          order_index: body.order_index || 0,
        }
        break
      case "tasks":
        if (!body.title || !body.repo_url) {
          return NextResponse.json(
            { success: false, message: "Task requires title and repo_url" },
            { status: 400 }
          )
        }
        payload = {
          title: body.title,
          description: body.description || "",
          repo_url: body.repo_url,
          sprint_id: body.sprint_id,
        }
        break
    }

    // Create in Modal (JSONL event sourcing)
    const modalUrl = `${MODAL_API_URL}/${entityType}`
    const response = await fetch(modalUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || data.error || `Modal API error: ${response.status}` },
        { status: response.status }
      )
    }

    // Backend already wrote to Supabase, extract the UUID for navigation
    const id = data.project_id || data.sprint_id || data.task_id

    return NextResponse.json({
      ...data,
      id, // Supabase UUID for navigation
    })
  } catch (error) {
    console.error("Create API error:", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
