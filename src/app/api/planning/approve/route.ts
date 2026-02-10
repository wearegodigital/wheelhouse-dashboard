import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyMultipleEntities } from '@/lib/sync-verification'

/**
 * Planning Approval API Route
 *
 * Calls the backend /planning/approve endpoint which creates entities directly in Supabase.
 * With Supabase-primary architecture, entities exist immediately after creation.
 * Verification confirms the entities were created successfully.
 */

const MODAL_API_URL = process.env.MODAL_API_URL || ""

interface ApproveRequest {
  conversationId: string        // Backend session ID (from SSE)
  supabaseConversationId?: string // Local DB record ID
  projectId?: string
  sprintId?: string
  modifications?: Record<string, unknown>
  recommendation?: Record<string, unknown>  // Fallback if DB save failed during streaming
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
    const { conversationId, supabaseConversationId, projectId, sprintId, modifications, recommendation } = body

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing required field: conversationId (backend session ID)' },
        { status: 400 }
      )
    }

    // 1. Call new backend /planning/approve endpoint
    // Forward recommendation as fallback in case DB save failed during streaming
    const modalResponse = await fetch(`${MODAL_API_URL}/planning/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        projectId,
        sprintId,
        modifications: modifications || {},
        ...(recommendation ? { recommendation } : {}),
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseConversationId && supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      await supabase
        .from('planning_conversations')
        .update({
          status: 'approved',
          completed_at: new Date().toISOString(),
        })
        .eq('id', supabaseConversationId)
    }

    // 3. Verify entities exist in Supabase
    // With Supabase-primary, Modal writes directly to Supabase, so entities exist immediately.
    // This verification is a simple existence check (no sync delay).
    let verificationResult
    if (supabaseUrl && supabaseServiceKey) {
      const entitiesToVerify: Array<{ type: 'projects' | 'sprints' | 'tasks', id: string }> = []

      // Add project if created
      if (result.project_id) {
        entitiesToVerify.push({ type: 'projects', id: result.project_id })
      }

      // Add sprints if created
      if (result.sprint_ids && result.sprint_ids.length > 0) {
        result.sprint_ids.forEach(sprintId => {
          entitiesToVerify.push({ type: 'sprints', id: sprintId })
        })
      }

      // Add tasks if created
      if (result.task_ids && result.task_ids.length > 0) {
        result.task_ids.forEach(taskId => {
          entitiesToVerify.push({ type: 'tasks', id: taskId })
        })
      }

      if (entitiesToVerify.length > 0) {
        verificationResult = await verifyMultipleEntities(
          entitiesToVerify,
          supabaseUrl,
          supabaseServiceKey
        )

        if (!verificationResult.verified) {
          console.warn('Some entities not found in Supabase:', verificationResult.failures)
        }
      }
    }

    // 4. Return result with created entity IDs and verification status
    return NextResponse.json({
      success: true,
      message: result.message || 'Recommendation approved and entities created',
      projectId: result.project_id || projectId,
      sprintIds: result.sprint_ids || [],
      taskIds: result.task_ids || [],
      verification: verificationResult,
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
