import { NextRequest, NextResponse } from 'next/server'

/**
 * Execution Control API Route
 *
 * Handles POST requests to control execution of projects, sprints, or tasks.
 * Proxies requests to the Modal backend API.
 */

type ExecutionLevel = 'project' | 'sprint' | 'task'
type ExecutionAction = 'run' | 'pause' | 'cancel'

interface ExecutionRequest {
  level: ExecutionLevel
  id: string
  action: ExecutionAction
}

interface ExecutionResponse {
  success: boolean
  message?: string
  execution_id?: string
  status?: string
}

interface ErrorResponse {
  error: string
  details?: string
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ExecutionRequest = await request.json()
    const { level, id, action } = body

    // Validate required fields
    if (!level || !id || !action) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: 'level, id, and action are all required'
        } as ErrorResponse,
        { status: 400 }
      )
    }

    // Validate level value
    const validLevels: ExecutionLevel[] = ['project', 'sprint', 'task']
    if (!validLevels.includes(level)) {
      return NextResponse.json(
        {
          error: 'Invalid level',
          details: `level must be one of: ${validLevels.join(', ')}`
        } as ErrorResponse,
        { status: 400 }
      )
    }

    // Validate action value
    const validActions: ExecutionAction[] = ['run', 'pause', 'cancel']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        {
          error: 'Invalid action',
          details: `action must be one of: ${validActions.join(', ')}`
        } as ErrorResponse,
        { status: 400 }
      )
    }

    // Check for Modal API URL configuration
    const modalApiUrl = process.env.MODAL_API_URL
    if (!modalApiUrl) {
      console.error('MODAL_API_URL environment variable is not configured')
      return NextResponse.json(
        {
          error: 'Server configuration error',
          details: 'Modal API URL is not configured'
        } as ErrorResponse,
        { status: 500 }
      )
    }

    // Make request to Modal backend
    const modalResponse = await fetch(`${modalApiUrl}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ level, id, action }),
    })

    // Handle non-OK responses from Modal
    if (!modalResponse.ok) {
      const errorText = await modalResponse.text()
      let errorDetails: string

      try {
        const errorJson = JSON.parse(errorText)
        errorDetails = errorJson.detail || errorJson.error || errorText
      } catch {
        errorDetails = errorText
      }

      console.error(`Modal API error (${modalResponse.status}):`, errorDetails)

      return NextResponse.json(
        {
          error: 'Execution failed',
          details: errorDetails
        } as ErrorResponse,
        { status: modalResponse.status }
      )
    }

    // Parse and return successful response
    const data: ExecutionResponse = await modalResponse.json()
    return NextResponse.json(data, { status: 200 })

  } catch (error) {
    // Handle unexpected errors
    console.error('Execution API error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      } as ErrorResponse,
      { status: 500 }
    )
  }
}
