import { NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { createClient } from "@/lib/supabase/server"

/**
 * Update API Route
 *
 * Proxies update requests to Modal API.
 * Note: With Supabase-primary architecture, the dashboard hooks (useProjects, useSprints, useTasks)
 * write directly to Supabase for most updates. This route is available for:
 * - External integrations that need to trigger Modal workflows
 * - Updates that require Modal business logic
 * - Backward compatibility with existing clients
 *
 * If you're adding new update functionality from the dashboard, consider writing directly to Supabase
 * in the React hooks instead of proxying through this route.
 */

const MODAL_API_URL = process.env.MODAL_API_URL || ""

type EntityType = "projects" | "sprints" | "tasks" | "clients" | "repos"

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const entityType = body.type as EntityType
    const entityId = body.id

    if (!entityType || !["projects", "sprints", "tasks", "clients", "repos"].includes(entityType)) {
      return NextResponse.json(
        { success: false, message: "Invalid or missing entity type" },
        { status: 400 }
      )
    }

    if (!entityId) {
      return NextResponse.json(
        { success: false, message: "Missing entity id" },
        { status: 400 }
      )
    }

    // Build the payload based on entity type
    const payload: Record<string, unknown> = {}

    switch (entityType) {
      case "projects":
        if (body.name !== undefined) payload.name = body.name
        if (body.description !== undefined) payload.description = body.description
        if (body.repo_url !== undefined) payload.repo_url = body.repo_url
        if (body.status !== undefined) payload.status = body.status
        if (body.client_id !== undefined) payload.client_id = body.client_id
        if (body.repo_id !== undefined) payload.repo_id = body.repo_id
        if (body.notion_id !== undefined) payload.notion_id = body.notion_id
        if (body.default_branch !== undefined) payload.default_branch = body.default_branch
        if (body.metadata !== undefined) payload.metadata = body.metadata
        break
      case "sprints":
        if (body.name !== undefined) payload.name = body.name
        if (body.description !== undefined) payload.description = body.description
        if (body.order_index !== undefined) payload.order_index = body.order_index
        if (body.pattern !== undefined) payload.pattern = body.pattern
        if (body.distribution !== undefined) payload.distribution = body.distribution
        if (body.pattern_config !== undefined) payload.pattern_config = body.pattern_config
        break
      case "tasks":
        if (body.title !== undefined) payload.title = body.title
        if (body.description !== undefined) payload.description = body.description
        if (body.repo_url !== undefined) payload.repo_url = body.repo_url
        if (body.sprint_id !== undefined) payload.sprint_id = body.sprint_id
        if (body.project_id !== undefined) payload.project_id = body.project_id
        if (body.pattern !== undefined) payload.pattern = body.pattern
        if (body.distribution !== undefined) payload.distribution = body.distribution
        if (body.pattern_config !== undefined) payload.pattern_config = body.pattern_config
        break
      case "clients":
        if (body.name !== undefined) payload.name = body.name
        if (body.status !== undefined) payload.status = body.status
        if (body.client_type !== undefined) payload.client_type = body.client_type
        if (body.notion_id !== undefined) payload.notion_id = body.notion_id
        if (body.contact_email !== undefined) payload.contact_email = body.contact_email
        if (body.contact_phone !== undefined) payload.contact_phone = body.contact_phone
        break
      case "repos":
        if (body.name !== undefined) payload.name = body.name
        if (body.client_id !== undefined) payload.client_id = body.client_id
        if (body.github_org !== undefined) payload.github_org = body.github_org
        if (body.github_repo !== undefined) payload.github_repo = body.github_repo
        if (body.default_branch !== undefined) payload.default_branch = body.default_branch
        if (body.repo_url !== undefined) payload.repo_url = body.repo_url
        if (body.description !== undefined) payload.description = body.description
        break
    }

    // Try Modal first if configured, fall back to Supabase direct update
    if (MODAL_API_URL) {
      try {
        const modalUrl = `${MODAL_API_URL}/${entityType}/${entityId}`
        const response = await fetch(modalUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.MODAL_API_KEY || ""}`,
          },
          body: JSON.stringify(payload),
        })

        // Check if response is JSON
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text()
          console.error(`[update] Modal API returned non-JSON response (${response.status}):`, text.slice(0, 200))
          // Fall through to Supabase fallback
        } else if (response.status === 502 || response.status === 503) {
          console.error(`[update] Modal API unavailable (${response.status}), falling back to Supabase`)
          // Fall through to Supabase fallback
        } else {
          const data = await response.json()
          if (!response.ok || !data.success) {
            console.error('[update] Modal API error:', response.status, data.message || data.error)
            return NextResponse.json(
              { success: false, message: 'Update request failed' },
              { status: response.status }
            )
          }
          return NextResponse.json(data)
        }
      } catch (modalError) {
        console.error("[update] Modal API network error, falling back to Supabase:", modalError)
        // Fall through to Supabase fallback
      }
    }

    // Supabase direct update fallback
    const supabase = await createClient()
    const now = new Date().toISOString()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from(entityType)
      .update({ ...payload, updated_at: now })
      .eq("id", entityId)
      .is("deleted_at", null)
      .select()
      .single()
    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, message: `${entityType.slice(0, -1)} updated`, data })
  } catch (error) {
    Sentry.captureException(error)
    console.error("[update] Update API error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
