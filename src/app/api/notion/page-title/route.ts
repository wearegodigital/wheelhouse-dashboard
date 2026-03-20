import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const MODAL_API_URL = process.env.MODAL_API_URL || ""

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: "Auth required" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const pageId = searchParams.get("page_id") || ""

  try {
    const resp = await fetch(`${MODAL_API_URL}/notion/page-title?page_id=${pageId}`, {
      headers: { Authorization: `Bearer ${process.env.MODAL_API_KEY || ""}` },
    })
    const data = await resp.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ title: "", error: "Failed" }, { status: 500 })
  }
}
