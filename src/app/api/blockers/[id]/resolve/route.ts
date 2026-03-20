import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from "@sentry/nextjs"
import { createClient as createServerClient } from '@/lib/supabase/server'

const MODAL_API_URL = process.env.MODAL_API_URL || ""

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  if (!MODAL_API_URL) {
    console.error('[blockers/resolve] MODAL_API_URL environment variable is not configured')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  try {
    const { id } = await params
    const body = await request.json()

    const modalResponse = await fetch(`${MODAL_API_URL}/blockers/${id}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MODAL_API_KEY || ""}`,
      },
      body: JSON.stringify(body),
    })

    if (!modalResponse.ok) {
      const errorText = await modalResponse.text()
      console.error('[blockers/resolve] Modal resolve error:', modalResponse.status, errorText)
      return NextResponse.json(
        { error: 'Failed to resolve blocker' },
        { status: modalResponse.status }
      )
    }

    const data = await modalResponse.json()
    return NextResponse.json(data)

  } catch (error) {
    Sentry.captureException(error)
    console.error('[blockers/resolve] Resolve API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
