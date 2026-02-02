import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { DecompositionRecommendation } from '@/types'

/**
 * Planning Approval API Route
 *
 * Handles POST requests to approve a planning recommendation.
 * Creates projects/sprints/tasks from the approved decomposition.
 */

interface ApproveRequest {
  conversationId: string
  projectId?: string
  sprintId?: string
  recommendation: DecompositionRecommendation
}

export async function POST(request: NextRequest) {
  try {
    const body: ApproveRequest = await request.json()
    const { conversationId, projectId, sprintId, recommendation } = body

    if (!conversationId || !recommendation) {
      return NextResponse.json(
        { error: 'Missing required fields: conversationId and recommendation' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role for admin operations
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

    // Update conversation status to approved
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

    // If we have sprints in the recommendation, create them
    if (recommendation.sprints && recommendation.sprints.length > 0 && projectId) {
      for (let sprintIndex = 0; sprintIndex < recommendation.sprints.length; sprintIndex++) {
        const sprint = recommendation.sprints[sprintIndex]

        // Create the sprint
        const { data: createdSprint, error: sprintError } = await supabase
          .from('sprints')
          .insert({
            project_id: projectId,
            name: sprint.name,
            description: sprint.description,
            order_index: sprintIndex,
            status: 'ready',
          })
          .select('id')
          .single()

        if (sprintError) {
          console.error('Error creating sprint:', sprintError)
          continue
        }

        // Create tasks for this sprint
        if (sprint.tasks && sprint.tasks.length > 0) {
          // Get project's repo_url
          const { data: project } = await supabase
            .from('projects')
            .select('repo_url, team_id')
            .eq('id', projectId)
            .single()

          for (let taskIndex = 0; taskIndex < sprint.tasks.length; taskIndex++) {
            const task = sprint.tasks[taskIndex]

            await supabase.from('tasks').insert({
              project_id: projectId,
              sprint_id: createdSprint.id,
              team_id: project?.team_id || null,
              repo_url: project?.repo_url || '',
              description: task.description,
              order_index: taskIndex,
              status: 'pending',
              mode: 'sequential',
              metadata: {
                estimated_complexity: task.estimatedComplexity,
              },
            })
          }
        }
      }

      // Update project status to ready
      await supabase
        .from('projects')
        .update({ status: 'ready' })
        .eq('id', projectId)
    }

    // If we have standalone tasks (no sprints), create them directly
    if (recommendation.tasks && recommendation.tasks.length > 0 && !recommendation.sprints) {
      // Get context (project or sprint)
      let repoUrl = ''
      let teamId: string | null = null

      if (projectId) {
        const { data: project } = await supabase
          .from('projects')
          .select('repo_url, team_id')
          .eq('id', projectId)
          .single()
        repoUrl = project?.repo_url || ''
        teamId = project?.team_id || null
      } else if (sprintId) {
        const { data: sprint } = await supabase
          .from('sprints')
          .select('project_id, projects(repo_url, team_id)')
          .eq('id', sprintId)
          .single()
        // @ts-expect-error - nested select typing
        repoUrl = sprint?.projects?.repo_url || ''
        // @ts-expect-error - nested select typing
        teamId = sprint?.projects?.team_id || null
      }

      for (let taskIndex = 0; taskIndex < recommendation.tasks.length; taskIndex++) {
        const task = recommendation.tasks[taskIndex]

        await supabase.from('tasks').insert({
          project_id: projectId || null,
          sprint_id: sprintId || null,
          team_id: teamId,
          repo_url: repoUrl,
          description: task.description,
          order_index: taskIndex,
          status: 'pending',
          mode: 'sequential',
          metadata: {
            estimated_complexity: task.estimatedComplexity,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Recommendation approved and entities created',
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
