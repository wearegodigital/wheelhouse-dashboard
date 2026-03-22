import { NextRequest, NextResponse } from "next/server"

const MODAL_API_URL = process.env.MODAL_API_URL || ""
const MODAL_API_KEY = process.env.MODAL_API_KEY || ""

async function modalFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${MODAL_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(MODAL_API_KEY ? { Authorization: `Bearer ${MODAL_API_KEY}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    },
  })
  return res
}

export async function GET(request: NextRequest) {
  const { searchParams } = await Promise.resolve(new URL(request.url))
  const projectId = searchParams.get("projectId")
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 })
  }
  const status = searchParams.get("status")
  const url = `/projects/${projectId}/plans${status ? `?status=${status}` : ""}`
  const res = await modalFetch(url)
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
