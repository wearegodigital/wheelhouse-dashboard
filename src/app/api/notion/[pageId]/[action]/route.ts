import { NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { createClient } from "@/lib/supabase/server"

const MODAL_API_URL = process.env.MODAL_API_URL || ""

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string; action: string }> }
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }
  const { pageId, action } = await params
  if (!["delegate", "review", "complete"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }
  try {
    const body = action === "review" ? await request.json() : {}
    const response = await fetch(`${MODAL_API_URL}/notion/tasks/${pageId}/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MODAL_API_KEY || ""}`,
      },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    Sentry.captureException(error)
    console.error("Notion action error:", error)
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 })
  }
}
