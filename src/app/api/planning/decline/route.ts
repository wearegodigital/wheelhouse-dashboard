import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from "@sentry/nextjs"
import { createClient as createServerClient } from '@/lib/supabase/server'

/**
 * Planning Decline API Route
 *
 * Calls the backend /planning/decline endpoint to reject the current recommendation
 * and optionally trigger regeneration with the user's feedback.
 */

const MODAL_API_URL = process.env.MODAL_API_URL || ""

interface DeclineRequest {
  conversationId: string
  feedback: string
}

interface ModalDeclineResponse {
  success: boolean
  regeneration_started?: boolean
  message?: string
  error?: string
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  if (!MODAL_API_URL) {
    console.error('MODAL_API_URL environment variable is not configured')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  try {
    const body: DeclineRequest = await request.json()
    const { conversationId, feedback } = body

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing required field: conversationId' },
        { status: 400 }
      )
    }

    if (!feedback?.trim()) {
      return NextResponse.json(
        { error: 'Missing required field: feedback' },
        { status: 400 }
      )
    }

    const modalResponse = await fetch(`${MODAL_API_URL}/planning/decline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MODAL_API_KEY || ""}`,
      },
      body: JSON.stringify({ conversationId, feedback }),
    })

    if (!modalResponse.ok) {
      const errorText = await modalResponse.text()
      console.error('[decline] Modal decline error:', modalResponse.status, errorText)
      return NextResponse.json(
        { error: 'Failed to decline recommendation' },
        { status: modalResponse.status }
      )
    }

    const result: ModalDeclineResponse = await modalResponse.json()

    if (!result.success) {
      console.error('[decline] Backend decline failed:', result.error, result.message)
      return NextResponse.json(
        { error: result.error || 'Decline failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      regeneration_started: result.regeneration_started ?? false,
      message: result.message || 'Recommendation declined',
    })

  } catch (error) {
    Sentry.captureException(error)
    console.error('[decline] Decline API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
