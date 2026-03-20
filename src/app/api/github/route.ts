import { NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { createClient } from "@/lib/supabase/server"

const MODAL_API_URL = process.env.MODAL_API_URL || ""

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: "Auth required" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get("endpoint")
  const org = searchParams.get("org") || ""
  const repo = searchParams.get("repo") || ""

  let url = ""
  if (endpoint === "orgs") url = `${MODAL_API_URL}/github/orgs`
  else if (endpoint === "repos") url = `${MODAL_API_URL}/github/repos?org=${org}`
  else if (endpoint === "branches") url = `${MODAL_API_URL}/github/branches?org=${org}&repo=${repo}`
  else return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 })

  try {
    const resp = await fetch(url, {
      headers: { "Authorization": `Bearer ${process.env.MODAL_API_KEY || ""}` },
    })
    const data = await resp.json()
    return NextResponse.json(data, { status: resp.status })
  } catch (error) {
    Sentry.captureException(error)
    console.error("GitHub API error:", error)
    return NextResponse.json({ error: "Failed to fetch from GitHub" }, { status: 500 })
  }
}
