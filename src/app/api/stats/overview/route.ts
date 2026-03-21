import { NextResponse } from 'next/server'
import * as Sentry from "@sentry/nextjs"
import { createClient } from '@/lib/supabase/server'

/**
 * Stats Overview API Route
 *
 * Handles GET requests to fetch execution statistics and overview data.
 * Proxies requests to the Modal backend API.
 */

interface StatsOverviewResponse {
  total_projects?: number
  total_sprints?: number
  total_tasks?: number
  completed_tasks?: number
  failed_tasks?: number
  in_progress_tasks?: number
  success_rate?: number
  average_duration?: number
  [key: string]: unknown
}

interface ErrorResponse {
  error: string
  details?: string
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
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
    const modalResponse = await fetch(`${modalApiUrl}/stats/overview`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MODAL_API_KEY || ""}`,
      },
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

      console.error(`[stats/overview] Modal API error (${modalResponse.status}):`, errorDetails)

      return NextResponse.json(
        { error: 'Failed to fetch stats overview' } as ErrorResponse,
        { status: modalResponse.status }
      )
    }

    // Parse and return successful response
    const data: StatsOverviewResponse = await modalResponse.json()
    return NextResponse.json(data, { status: 200 })

  } catch (error) {
    // Handle unexpected errors
    Sentry.captureException(error)
    console.error('Stats overview API error:', error)

    return NextResponse.json(
      { error: 'Internal server error' } as ErrorResponse,
      { status: 500 }
    )
  }
}
