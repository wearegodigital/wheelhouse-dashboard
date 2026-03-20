import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const MODAL_API_URL = process.env.MODAL_API_URL || ""

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: "Auth required" }, { status: 401 })

  try {
    const body = await request.json()
    const resp = await fetch(`${MODAL_API_URL}/planning/guided`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MODAL_API_KEY || ""}`,
      },
      body: JSON.stringify(body),
    })

    const contentType = resp.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      console.error("[planning/guided] Non-JSON response:", resp.status)
      return NextResponse.json({ error: "AI service unavailable" }, { status: 502 })
    }

    const data = await resp.json()
    return NextResponse.json(data, { status: resp.status })
  } catch (err) {
    console.error("[planning/guided] Error:", err)
    return NextResponse.json({ error: "Planning step failed" }, { status: 500 })
  }
}
