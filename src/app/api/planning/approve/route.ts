import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Planning Approval API Route
 *
 * Calls the new backend /planning/approve endpoint which handles all entity creation.
 * The dashboard no longer creates entities directly - backend owns that logic.
 */

const MODAL_API_URL = process.env.MODAL_API_URL || ""

interface ApproveRequest {
  conversationId: string        // Backend session ID (from SSE)
  supabaseConversationId?: string // Local DB record ID
  projectId?: string
  sprintId?: string
  modifications?: Record<string, unknown>
}

interface ModalApproveResponse {
  success: boolean
  project_id?: string
  sprint_ids?: string[]
  task_ids?: string[]
  message?: string
  error?: string
}

export async function POST(request: NextRequest) {
  if (!MODAL_API_URL) {
    console.error('MODAL_API_URL environment variable is not configured')
    return NextResponse.json(
      { error: 'Server configuration error: MODAL_API_URL not set' },
      { status: 500 }
    )
  }

  try {
    const body: ApproveRequest = await request.json()
    const { conversationId, supabaseConversationId, projectId, sprintId, modifications } = body

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing required field: conversationId (backend session ID)' },
        { status: 400 }
      )
    }

    // 1. Call new backend /planning/approve endpoint
    const modalResponse = await fetch(`${MODAL_API_URL}/planning/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        projectId,
        sprintId,
        modifications: modifications || {},
      }),
    })

    if (!modalResponse.ok) {
      const errorText = await modalResponse.text()
      console.error('Modal approve error:', modalResponse.status, errorText)
      return NextResponse.json(
        { error: 'Failed to approve recommendation', details: errorText },
        { status: modalResponse.status }
      )
    }

    const result: ModalApproveResponse = await modalResponse.json()

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Approval failed', message: result.message },
        { status: 500 }
      )
    }

    // 2. Update LOCAL conversation status (this stays in Supabase - not event-sourced)
    if (supabaseConversationId) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        await supabase
          .from('planning_conversations')
          .update({
            status: 'approved',
            completed_at: new Date().toISOString(),
          })
          .eq('id', supabaseConversationId)
      }
    }

    // 3. Return result with created entity IDs
    return NextResponse.json({
      success: true,
      message: result.message || 'Recommendation approved and entities created',
      projectId: result.project_id || projectId,
      sprintIds: result.sprint_ids || [],
      taskIds: result.task_ids || [],
    })

  } catch (error) {
    console.error('Approve API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
