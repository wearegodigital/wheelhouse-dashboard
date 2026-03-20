import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const MODAL_API_URL = process.env.MODAL_API_URL || ""

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: "Auth required" }, { status: 401 })

  try {
    const body = await request.json()
    const resp = await fetch(`${MODAL_API_URL}/planning/guided/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MODAL_API_KEY || ""}`,
      },
      body: JSON.stringify(body),
    })

    // This is SSE — pass through the stream
    if (resp.headers.get("content-type")?.includes("text/event-stream")) {
      return new Response(resp.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      })
    }

    const data = await resp.json()
    return NextResponse.json(data, { status: resp.status })
  } catch (err) {
    console.error("[planning/guided/generate] Error:", err)
    return NextResponse.json({ error: "Plan generation failed" }, { status: 500 })
  }
}
