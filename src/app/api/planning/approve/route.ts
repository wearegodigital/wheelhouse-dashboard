import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { DecompositionRecommendation } from '@/types'

/**
 * Planning Approval API Route
 *
 * Handles POST requests to approve a planning recommendation.
 * Creates projects/sprints/tasks through Modal API for proper JSONL event sourcing.
 */

const MODAL_API_URL = process.env.MODAL_API_URL || ""

interface ApproveRequest {
  conversationId: string
  projectId?: string
  sprintId?: string
  recommendation: DecompositionRecommendation
}

interface ModalCreateResponse {
  success: boolean
  project_id?: string
  sprint_id?: string
  task_id?: string
  message?: string
  error?: string
}

async function createViaModal(
  entityType: 'projects' | 'sprints' | 'tasks',
  data: Record<string, unknown>
): Promise<ModalCreateResponse> {
  const response = await fetch(`${MODAL_API_URL}/${entityType}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return response.json()
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
    const { conversationId, projectId, sprintId, recommendation } = body

    if (!conversationId || !recommendation) {
      return NextResponse.json(
        { error: 'Missing required fields: conversationId and recommendation' },
        { status: 400 }
      )
    }

    // Create Supabase client for conversation updates only
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Update conversation status to approved (this stays in Supabase - not event-sourced)
    const { error: conversationError } = await supabase
      .from('planning_conversations')
      .update({
        status: 'approved',
        completed_at: new Date().toISOString(),
      })
      .eq('id', conversationId)

    if (conversationError) {
      console.error('Error updating conversation:', conversationError)
      return NextResponse.json(
        { error: 'Failed to update conversation status' },
        { status: 500 }
      )
    }

    // Get project's repo_url for task creation
    let repoUrl = ''
    if (projectId) {
      const { data: project } = await supabase
        .from('projects')
        .select('repo_url')
        .eq('id', projectId)
        .single()
      repoUrl = project?.repo_url || ''
    }

    const createdEntities: { sprints: string[]; tasks: string[] } = {
      sprints: [],
      tasks: [],
    }

    // If we have sprints in the recommendation, create them via Modal
    if (recommendation.sprints && recommendation.sprints.length > 0 && projectId) {
      for (let sprintIndex = 0; sprintIndex < recommendation.sprints.length; sprintIndex++) {
        const sprint = recommendation.sprints[sprintIndex]

        // Create sprint via Modal API
        const sprintResult = await createViaModal('sprints', {
          project_id: projectId,
          name: sprint.name,
          description: sprint.description || '',
          order_index: sprintIndex,
        })

        if (!sprintResult.success || !sprintResult.sprint_id) {
          console.error('Error creating sprint via Modal:', sprintResult.error)
          continue
        }

        createdEntities.sprints.push(sprintResult.sprint_id)

        // Create tasks for this sprint via Modal
        if (sprint.tasks && sprint.tasks.length > 0) {
          for (let taskIndex = 0; taskIndex < sprint.tasks.length; taskIndex++) {
            const task = sprint.tasks[taskIndex]

            const taskResult = await createViaModal('tasks', {
              title: task.description.substring(0, 100),
              description: task.description,
              repo_url: repoUrl,
              sprint_id: sprintResult.sprint_id,
            })

            if (taskResult.success && taskResult.task_id) {
              createdEntities.tasks.push(taskResult.task_id)
            } else {
              console.error('Error creating task via Modal:', taskResult.error)
            }
          }
        }
      }

      // Update project status to ready (stays in Supabase for now)
      await supabase
        .from('projects')
        .update({ status: 'ready' })
        .eq('id', projectId)
    }

    // If we have standalone tasks (no sprints), create them via Modal
    if (recommendation.tasks && recommendation.tasks.length > 0 && !recommendation.sprints) {
      // Get repo_url if we have a sprint context
      if (!repoUrl && sprintId) {
        const { data: sprint } = await supabase
          .from('sprints')
          .select('project_id, projects(repo_url)')
          .eq('id', sprintId)
          .single()
        // @ts-expect-error - nested select typing
        repoUrl = sprint?.projects?.repo_url || ''
      }

      for (let taskIndex = 0; taskIndex < recommendation.tasks.length; taskIndex++) {
        const task = recommendation.tasks[taskIndex]

        const taskResult = await createViaModal('tasks', {
          title: task.description.substring(0, 100),
          description: task.description,
          repo_url: repoUrl,
          sprint_id: sprintId,
        })

        if (taskResult.success && taskResult.task_id) {
          createdEntities.tasks.push(taskResult.task_id)
        } else {
          console.error('Error creating task via Modal:', taskResult.error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Recommendation approved and entities created via Modal',
      projectId: projectId || null,
      created: createdEntities,
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
