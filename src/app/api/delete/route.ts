import { NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { createClient } from "@/lib/supabase/server"

const MODAL_API_URL = process.env.MODAL_API_URL || ""

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const entityType = searchParams.get("type") // jobs, sprints, tasks, plans
  const entityId = searchParams.get("id")
  const cascade = searchParams.get("cascade") === "true"

  if (!entityType || !entityId) {
    return NextResponse.json(
      { success: false, message: "Missing type or id parameter" },
      { status: 400 }
    )
  }

  if (!["jobs", "sprints", "tasks", "plans"].includes(entityType)) {
    return NextResponse.json(
      { success: false, message: "Invalid entity type" },
      { status: 400 }
    )
  }

  // Try Modal API first (for projects created through Modal/JSONL pipeline)
  // Only attempt Modal for entity types it knows about
  if (MODAL_API_URL && ["jobs", "sprints", "tasks"].includes(entityType)) {
    try {
      const params = new URLSearchParams()
      if (cascade) params.append("cascade", "true")
      params.append("force", "true")
      const query = params.toString()

      const modalUrl = `${MODAL_API_URL}/${entityType}/${entityId}${query ? `?${query}` : ""}`

      const response = await fetch(modalUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.MODAL_API_KEY || ""}`,
        },
      })

      const contentType = response.headers.get("content-type")
      if (contentType?.includes("application/json")) {
        const data = await response.json()
        if (response.ok) {
          // Modal succeeded - it handles soft deletes in Supabase directly via WheelhouseDB
          // No need for Supabase cleanup, Modal already did the soft delete
          return NextResponse.json(data)
        }
        // If not 404, return generic error
        if (response.status !== 404) {
          console.error('[delete] Modal API error:', response.status, data.message || data.error)
          return NextResponse.json(
            { success: false, message: 'Delete request failed' },
            { status: response.status }
          )
        }
        // 404 = not in JSONL, fall through to Supabase direct delete
        console.log("Modal API returned 404, falling back to Supabase direct delete")
      } else {
        const text = await response.text()
        console.error(`Modal API returned non-JSON (${response.status}):`, text.slice(0, 200))
        // Non-404 non-JSON errors are infrastructure issues
        if (response.status !== 404) {
          return NextResponse.json(
            { success: false, message: `Modal API unavailable (status: ${response.status})` },
            { status: 502 }
          )
        }
      }
    } catch (error) {
      console.error("Modal API call failed, falling back to Supabase:", error)
      // Network error — fall through to Supabase
    }
  }

  // Fallback: soft delete directly in Supabase
  // Handles projects created via dashboard UI (direct Supabase insert, no JSONL events)
  // Also handles clients and repos (not in Modal at all)
  try {
    const now = new Date().toISOString()
    // Use typed objects per table to satisfy Supabase typed client
    const jobSoftDelete = { deleted_at: now, deleted_by: 'dashboard-user', status: 'deleted' as const, updated_at: now }
    const sprintSoftDelete = { deleted_at: now, deleted_by: 'dashboard-user', status: 'deleted' as const, updated_at: now }
    const taskSoftDelete = { deleted_at: now, deleted_by: 'dashboard-user', status: 'deleted' as const, updated_at: now }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    if (cascade && entityType === "jobs") {
      // Get sprint IDs for this job
      const { data: sprints } = await supabase
        .from("sprints")
        .select("id")
        .eq("project_id", entityId)
        .is("deleted_at", null)

      const sprintRows = sprints as { id: string }[] | null
      if (sprintRows && sprintRows.length > 0) {
        const sprintIds = sprintRows.map((s) => s.id)
        // Soft delete tasks in those sprints
        await supabase.from("tasks").update(taskSoftDelete).in("sprint_id", sprintIds)
        // Soft delete the sprints
        await supabase.from("sprints").update(sprintSoftDelete).eq("project_id", entityId)
      }

      // Also soft delete tasks directly linked to job (no sprint)
      await supabase.from("tasks").update(taskSoftDelete).eq("project_id", entityId)

      // Soft delete planning conversations for this job
      await supabase.from("planning_conversations").delete().eq("project_id", entityId)
    }

    if (cascade && entityType === "sprints") {
      await supabase.from("tasks").update(taskSoftDelete).eq("sprint_id", entityId)
    }

    // Soft delete the entity itself — use literal table names to satisfy typed client
    let deleteError: { message: string } | null = null
    if (entityType === "jobs") {
      const { error } = await db.from("jobs").update(jobSoftDelete).eq("id", entityId)
      deleteError = error
    } else if (entityType === "sprints") {
      const { error } = await supabase.from("sprints").update(sprintSoftDelete).eq("id", entityId)
      deleteError = error
    } else if (entityType === "tasks") {
      const { error } = await supabase.from("tasks").update(taskSoftDelete).eq("id", entityId)
      deleteError = error
    } else if (entityType === "plans") {
      const { error } = await db.from("plans").update({ deleted_at: now, updated_at: now }).eq("id", entityId)
      deleteError = error
    }

    if (deleteError) {
      console.error("[delete] Supabase soft delete error:", deleteError)
      return NextResponse.json(
        { success: false, message: 'Delete request failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${entityType.slice(0, -1)} deleted`,
      deleted_at: now,
    })
  } catch (error) {
    Sentry.captureException(error)
    console.error("[delete] Supabase fallback soft delete error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
