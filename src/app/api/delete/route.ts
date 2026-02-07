import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const MODAL_API_URL = process.env.MODAL_API_URL || ""

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const entityType = searchParams.get("type") // projects, sprints, tasks
  const entityId = searchParams.get("id")
  const cascade = searchParams.get("cascade") === "true"

  if (!entityType || !entityId) {
    return NextResponse.json(
      { success: false, message: "Missing type or id parameter" },
      { status: 400 }
    )
  }

  if (!["projects", "sprints", "tasks"].includes(entityType)) {
    return NextResponse.json(
      { success: false, message: "Invalid entity type" },
      { status: 400 }
    )
  }

  // Try Modal API first (for projects created through Modal/JSONL pipeline)
  if (MODAL_API_URL) {
    try {
      const params = new URLSearchParams()
      if (cascade) params.append("cascade", "true")
      const query = params.toString()

      const modalUrl = `${MODAL_API_URL}/${entityType}/${entityId}${query ? `?${query}` : ""}`
      console.log(`Calling Modal API: DELETE ${modalUrl}`)

      const response = await fetch(modalUrl, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })

      const contentType = response.headers.get("content-type")
      if (contentType?.includes("application/json")) {
        const data = await response.json()
        if (response.ok) {
          // Modal succeeded (JSONL event written). Also clean up Supabase
          // immediately so the dashboard reflects the deletion without
          // waiting for the async sync worker.
          try {
            const supabase = await createClient()
            if (cascade && entityType === "projects") {
              const { data: sprints } = await supabase
                .from("sprints")
                .select("id")
                .eq("project_id", entityId)
              const sprintRows = sprints as { id: string }[] | null
              if (sprintRows && sprintRows.length > 0) {
                const sprintIds = sprintRows.map((s) => s.id)
                await supabase.from("tasks").delete().in("sprint_id", sprintIds)
                await supabase.from("sprints").delete().eq("project_id", entityId)
              }
              await supabase.from("tasks").delete().eq("project_id", entityId)
              await supabase.from("planning_conversations").delete().eq("project_id", entityId)
            }
            if (cascade && entityType === "sprints") {
              await supabase.from("tasks").delete().eq("sprint_id", entityId)
            }
            if (entityType === "projects") {
              await supabase.from("projects").delete().eq("id", entityId)
            } else if (entityType === "sprints") {
              await supabase.from("sprints").delete().eq("id", entityId)
            } else {
              await supabase.from("tasks").delete().eq("id", entityId)
            }
          } catch (supabaseErr) {
            // Non-fatal: JSONL is source of truth, sync worker will catch up
            console.warn("Supabase cleanup after Modal delete failed:", supabaseErr)
          }
          return NextResponse.json(data)
        }
        // If not 404, return the Modal error as-is
        if (response.status !== 404) {
          return NextResponse.json(
            { success: false, message: data.message || `Modal API error: ${response.status}`, error: data.error },
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

  // Fallback: delete directly from Supabase
  // Handles projects created via dashboard UI (direct Supabase insert, no JSONL events)
  try {
    const supabase = await createClient()

    if (cascade && entityType === "projects") {
      // Get sprint IDs for this project
      const { data: sprints } = await supabase
        .from("sprints")
        .select("id")
        .eq("project_id", entityId)

      const sprintRows = sprints as { id: string }[] | null
      if (sprintRows && sprintRows.length > 0) {
        const sprintIds = sprintRows.map((s) => s.id)
        // Delete tasks in those sprints
        await supabase.from("tasks").delete().in("sprint_id", sprintIds)
        // Delete the sprints
        await supabase.from("sprints").delete().eq("project_id", entityId)
      }

      // Also delete tasks directly linked to project (no sprint)
      await supabase.from("tasks").delete().eq("project_id", entityId)

      // Delete planning conversations for this project
      await supabase.from("planning_conversations").delete().eq("project_id", entityId)
    }

    if (cascade && entityType === "sprints") {
      await supabase.from("tasks").delete().eq("sprint_id", entityId)
    }

    // Delete the entity itself — use literal table names to satisfy typed client
    let deleteError: { message: string } | null = null
    if (entityType === "projects") {
      const { error } = await supabase.from("projects").delete().eq("id", entityId)
      deleteError = error
    } else if (entityType === "sprints") {
      const { error } = await supabase.from("sprints").delete().eq("id", entityId)
      deleteError = error
    } else {
      const { error } = await supabase.from("tasks").delete().eq("id", entityId)
      deleteError = error
    }

    if (deleteError) {
      console.error("Supabase delete error:", deleteError)
      return NextResponse.json(
        { success: false, message: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${entityType.slice(0, -1)} deleted`,
      deleted_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Supabase fallback delete error:", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
