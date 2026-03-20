import { NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { createClient } from "@/lib/supabase/server"

const MODAL_API_URL = process.env.MODAL_API_URL || ""

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") || "to_delegate"
  try {
    const response = await fetch(`${MODAL_API_URL}/notion/tasks?status=${status}`, {
      headers: { "Authorization": `Bearer ${process.env.MODAL_API_KEY || ""}` },
    })
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    Sentry.captureException(error)
    console.error("Notion API error:", error)
    return NextResponse.json({ tasks: [], error: "Failed to fetch Notion tasks" }, { status: 500 })
  }
}
