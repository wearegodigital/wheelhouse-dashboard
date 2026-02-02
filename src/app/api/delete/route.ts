import { NextRequest, NextResponse } from "next/server"

const MODAL_API_URL = process.env.MODAL_API_URL || ""

export async function DELETE(request: NextRequest) {
  if (!MODAL_API_URL) {
    console.error("MODAL_API_URL environment variable is not configured")
    return NextResponse.json(
      { success: false, message: "Server configuration error" },
      { status: 500 }
    )
  }

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

  try {
    const params = new URLSearchParams()
    if (cascade) params.append("cascade", "true")
    const query = params.toString()

    const modalUrl = `${MODAL_API_URL}/${entityType}/${entityId}${query ? `?${query}` : ""}`
    console.log(`Calling Modal API: DELETE ${modalUrl}`)

    const response = await fetch(modalUrl, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
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

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || `Modal API error: ${response.status}`, error: data.error },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Delete API error:", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
