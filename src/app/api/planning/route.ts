import { NextRequest } from 'next/server'

// Use Edge Runtime for proper SSE streaming on Vercel
export const runtime = 'edge'

interface PlanningChatRequest {
  projectId?: string
  sprintId?: string
  conversationId?: string
  message: string
  history?: Array<{ role: string; content: string }>
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PlanningChatRequest

    // Validate required fields
    if (!body.message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate Modal API URL is configured
    const modalApiUrl = process.env.MODAL_API_URL
    if (!modalApiUrl) {
      console.error('MODAL_API_URL environment variable is not configured')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Call Modal API with history for context
    const response = await fetch(`${modalApiUrl}/planning/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: body.message,
        projectId: body.projectId,
        sprintId: body.sprintId,
        conversationId: body.conversationId,
        history: body.history || [], // Include conversation history for context
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Modal API error:', response.status, errorText)
      return new Response(
        JSON.stringify({
          error: 'Failed to connect to planning service',
          details: errorText,
        }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if response is actually a stream
    if (!response.body) {
      return new Response(
        JSON.stringify({ error: 'No response stream from planning service' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Pass through the SSE stream directly from Modal
    // Modal already sends properly formatted SSE, no need to re-process
    const stream = response.body

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable proxy buffering (nginx)
      },
    })
  } catch (error) {
    console.error('Error processing planning request:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
