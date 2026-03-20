import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from "@sentry/nextjs"
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  const { id } = await params
  const modalApiUrl = process.env.MODAL_API_URL

  if (!modalApiUrl) {
    console.error('[execute/status] MODAL_API_URL environment variable is not configured')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(`${modalApiUrl}/execute/status/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MODAL_API_KEY || ""}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[execute/status] Modal API error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Status fetch failed' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    Sentry.captureException(error)
    console.error('[execute/status] Error fetching status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
