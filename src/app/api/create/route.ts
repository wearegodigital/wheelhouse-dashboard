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

    // Insert into Supabase immediately (avoids waiting for sync worker)
    // The sync worker will see the row exists (via source_id) and update if needed
    const supabaseId = data.supabase_id
    const sourceId = data.project_id || data.sprint_id || data.task_id

    if (supabaseId && entityType === "projects") {
      try {
        const supabase = await createClient()
        const projectPayload = payload as CreateProjectBody
        await supabase.from("projects").upsert({
          id: supabaseId,
          source_id: sourceId,
          name: projectPayload.name,
          description: projectPayload.description || "",
          repo_url: projectPayload.repo_url || "",
          default_branch: body.default_branch || "main",
          status: "planning" as const,
          metadata: {},
        }, { onConflict: "id" })
      } catch (err) {
        // Non-fatal: sync worker will catch up
        console.error("Supabase immediate insert failed (sync will catch up):", err)
      }
    }

    return NextResponse.json({
      ...data,
      // Return supabase_id so frontend can navigate to the project
      id: supabaseId || sourceId,
    })
  } catch (error) {
    console.error("Create API error:", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
