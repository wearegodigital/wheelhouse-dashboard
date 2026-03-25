import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Sandbox Warm API Route
 *
 * Fire-and-forget endpoint to pre-warm the Modal planning sandbox
 * before the user reaches the planning chat step.
 */

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  const modalApiUrl = process.env.MODAL_API_URL
  if (!modalApiUrl) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(`${modalApiUrl}/planning/warm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MODAL_API_KEY || ''}`,
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[planning/warm] Error warming sandbox:', error)
    return NextResponse.json(
      { error: 'Failed to warm sandbox' },
      { status: 500 }
    )
  }
}
