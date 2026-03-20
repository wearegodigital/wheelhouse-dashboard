import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from "@sentry/nextjs"
import { createClient as createServerClient } from '@/lib/supabase/server'

const MODAL_API_URL = process.env.MODAL_API_URL || ""

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  if (!MODAL_API_URL) {
    console.error('[blockers] MODAL_API_URL environment variable is not configured')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()

    const modalResponse = await fetch(
      `${MODAL_API_URL}/blockers${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.MODAL_API_KEY || ""}`,
        },
      }
    )

    if (!modalResponse.ok) {
      const errorText = await modalResponse.text()
      console.error('[blockers] Modal list error:', modalResponse.status, errorText)
      return NextResponse.json(
        { error: 'Failed to fetch blockers' },
        { status: modalResponse.status }
      )
    }

    const data = await modalResponse.json()
    return NextResponse.json(data)

  } catch (error) {
    Sentry.captureException(error)
    console.error('[blockers] List API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
