import { NextRequest, NextResponse } from "next/server"

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

type EntityType = "projects" | "sprints" | "tasks"

export async function PUT(request: NextRequest) {
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
    const entityId = body.id

    if (!entityType || !["projects", "sprints", "tasks"].includes(entityType)) {
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
        break
      case "sprints":
        if (body.name !== undefined) payload.name = body.name
        if (body.description !== undefined) payload.description = body.description
        if (body.order_index !== undefined) payload.order_index = body.order_index
        break
      case "tasks":
        if (body.title !== undefined) payload.title = body.title
        if (body.description !== undefined) payload.description = body.description
        if (body.repo_url !== undefined) payload.repo_url = body.repo_url
        if (body.sprint_id !== undefined) payload.sprint_id = body.sprint_id
        if (body.project_id !== undefined) payload.project_id = body.project_id
        break
    }

    const modalUrl = `${MODAL_API_URL}/${entityType}/${entityId}`
    console.log(`Calling Modal API: PUT ${modalUrl}`)

    const response = await fetch(modalUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    // Check if response is JSON
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text()
      console.error(`Modal API returned non-JSON response (${response.status}):`, text.slice(0, 200))
      return NextResponse.json(
        {
          success: false,
          message: `Modal API unavailable or returned invalid response (status: ${response.status}). Check MODAL_API_URL configuration.`,
          debug: { url: modalUrl, status: response.status }
        },
        { status: 502 }
      )
    }

    const data = await response.json()

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || data.error || `Modal API error: ${response.status}` },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Update API error:", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
