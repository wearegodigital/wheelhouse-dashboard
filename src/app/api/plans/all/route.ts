import { NextRequest, NextResponse } from "next/server"

const MODAL_API_URL = process.env.MODAL_API_URL || ""
const MODAL_API_KEY = process.env.MODAL_API_KEY || ""

export async function GET(request: NextRequest) {
  if (!MODAL_API_URL) {
    return NextResponse.json({ error: "MODAL_API_URL not configured" }, { status: 503 })
  }
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const url = `${MODAL_API_URL}/plans${status ? `?status=${status}` : ""}`
  try {
    const res = await fetch(url, {
      headers: {
        ...(MODAL_API_KEY ? { Authorization: `Bearer ${MODAL_API_KEY}` } : {}),
      },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Upstream unavailable" }, { status: 502 })
  }
}
