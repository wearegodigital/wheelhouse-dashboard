import { NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { createClient } from "@/lib/supabase/server"

type EntityType = "projects" | "sprints" | "tasks" | "clients" | "repos"

interface CreateProjectBody {
  name: string
  description?: string
  repo_url?: string
  default_branch?: string
  client_id?: string
  repo_id?: string
  notion_id?: string
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

interface CreateClientBody {
  name: string
  status?: string
  client_type?: string
  notion_id?: string
  contact_email?: string
  contact_phone?: string
}

interface CreateRepoBody {
  name: string
  client_id?: string
  github_org?: string
  github_repo?: string
  default_branch?: string
  repo_url?: string
  description?: string
}

async function supabaseFallback(
  entityType: EntityType,
  payload: CreateProjectBody | CreateSprintBody | CreateTaskBody | CreateClientBody | CreateRepoBody
): Promise<NextResponse> {
  const supabase = await createClient()

  switch (entityType) {
    case "projects": {
      const p = payload as CreateProjectBody
      const { data, error } = await supabase
        .from("projects")
        .insert({
          name: p.name || "Untitled Project",
          description: p.description || "",
          repo_url: p.repo_url || "",
          default_branch: p.default_branch || "main",
          client_id: p.client_id || null,
          repo_id: p.repo_id || null,
          notion_id: p.notion_id || null,
          status: "draft" as const,
          metadata: {},
        })
        .select("id")
        .single()
      if (error) throw error
      const row = data as { id: string }
      return NextResponse.json(
        { success: true, project_id: row.id, id: row.id, message: "Project created" },
        { status: 201 }
      )
    }
    case "sprints": {
      const p = payload as CreateSprintBody
      const { data, error } = await supabase
        .from("sprints")
        .insert({
          project_id: p.project_id,
          name: p.name,
          description: p.description || "",
          order_index: p.order_index || 0,
          status: "draft" as const,
        })
        .select("id")
        .single()
      if (error) throw error
      const row = data as { id: string }
      return NextResponse.json(
        { success: true, sprint_id: row.id, id: row.id, message: "Sprint created" },
        { status: 201 }
      )
    }
    case "tasks": {
      const p = payload as CreateTaskBody
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title: p.title,
          description: p.description || "",
          repo_url: p.repo_url,
          sprint_id: p.sprint_id || null,
          project_id: p.project_id || null,
          status: "pending" as const,
        })
        .select("id")
        .single()
      if (error) throw error
      const row = data as { id: string }
      return NextResponse.json(
        { success: true, task_id: row.id, id: row.id, message: "Task created" },
        { status: 201 }
      )
    }
    case "clients": {
      const p = payload as CreateClientBody
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("clients")
        .insert({
          name: p.name,
          status: p.status || "active",
          client_type: p.client_type || "project-based",
          notion_id: p.notion_id || null,
          contact_email: p.contact_email || null,
          contact_phone: p.contact_phone || null,
        })
        .select("id")
        .single()
      if (error) throw error
      const row = data as { id: string }
      return NextResponse.json(
        { success: true, client_id: row.id, id: row.id, message: "Client created" },
        { status: 201 }
      )
    }
    case "repos": {
      const p = payload as CreateRepoBody
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("repos")
        .insert({
          name: p.name,
          client_id: p.client_id || null,
          github_org: p.github_org || "",
          github_repo: p.github_repo || "",
          default_branch: p.default_branch || "main",
          repo_url: p.repo_url || "",
          description: p.description || "",
        })
        .select("id")
        .single()
      if (error) throw error
      const row = data as { id: string }
      return NextResponse.json(
        { success: true, repo_id: row.id, id: row.id, message: "Repo created" },
        { status: 201 }
      )
    }
    default:
      return NextResponse.json({ success: false, message: "Unknown entity type" }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  const MODAL_API_URL = process.env.MODAL_API_URL || ""

  try {
    const body = await request.json()
    const entityType = body.type as EntityType

    if (!entityType || !["projects", "sprints", "tasks", "clients", "repos"].includes(entityType)) {
      return NextResponse.json(
        { success: false, message: "Invalid or missing entity type" },
        { status: 400 }
      )
    }

    // Build the payload based on entity type
    let payload: CreateProjectBody | CreateSprintBody | CreateTaskBody | CreateClientBody | CreateRepoBody

    switch (entityType) {
      case "projects":
        payload = {
          name: body.name,
          description: body.description || "",
          repo_url: body.repo_url || "",
          default_branch: body.default_branch || "main",
          client_id: body.client_id,
          repo_id: body.repo_id,
          notion_id: body.notion_id,
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
          project_id: body.project_id,
        }
        break
      case "clients":
        if (!body.name) {
          return NextResponse.json(
            { success: false, message: "Client requires name" },
            { status: 400 }
          )
        }
        payload = {
          name: body.name,
          status: body.status,
          client_type: body.client_type,
          notion_id: body.notion_id,
          contact_email: body.contact_email,
          contact_phone: body.contact_phone,
        }
        break
      case "repos":
        if (!body.name) {
          return NextResponse.json(
            { success: false, message: "Repo requires name" },
            { status: 400 }
          )
        }
        payload = {
          name: body.name,
          client_id: body.client_id,
          github_org: body.github_org,
          github_repo: body.github_repo,
          default_branch: body.default_branch,
          repo_url: body.repo_url,
          description: body.description,
        }
        break
    }

    // Try Modal first (if configured)
    if (MODAL_API_URL) {
      try {
        const modalUrl = `${MODAL_API_URL}/${entityType}`
        const response = await fetch(modalUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.MODAL_API_KEY || ""}`,
          },
          body: JSON.stringify(payload),
        })

        const contentType = response.headers.get("content-type") || ""
        if (!contentType.includes("application/json")) {
          console.warn(`Modal returned non-JSON: ${contentType}, falling back to Supabase`)
          // fall through to Supabase fallback below
        } else {
          const data = await response.json()

          if (!response.ok || !data.success) {
            console.error('[create] Modal API error:', response.status, data.message || data.error, data)
            console.warn('Modal API error, falling back to Supabase')
            // fall through to Supabase fallback below
          } else {
            // Modal succeeded — extract the UUID for navigation
            const id = data.project_id || data.sprint_id || data.task_id || data.client_id || data.repo_id
            return NextResponse.json({
              ...data,
              id, // Supabase UUID for navigation
            })
          }
        }
      } catch (modalError) {
        console.warn('[create] Modal request failed, falling back to Supabase:', modalError)
        // fall through to Supabase fallback below
      }
    } else {
      console.warn("MODAL_API_URL not configured, using Supabase directly")
    }

    // Supabase fallback
    try {
      return await supabaseFallback(entityType, payload!)
    } catch (supabaseError) {
      console.error('[create] Supabase fallback failed:', supabaseError)
      const message = supabaseError instanceof Error ? supabaseError.message : "Supabase insert failed"
      return NextResponse.json(
        { success: false, message },
        { status: 500 }
      )
    }
  } catch (error) {
    Sentry.captureException(error)
    console.error("Create API error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
