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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const res = await modalFetch(`/plans/${id}`)
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const res = await modalFetch(`/plans/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const res = await modalFetch(`/plans/${id}`, { method: "DELETE" })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
