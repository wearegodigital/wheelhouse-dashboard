import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const MODAL_API_URL = process.env.MODAL_API_URL || ""

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: "Auth required" }, { status: 401 })

  try {
    const resp = await fetch(`${MODAL_API_URL}/notion/sync`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.MODAL_API_KEY || ""}` },
    })
    const data = await resp.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Sync failed" }, { status: 500 })
  }
}
