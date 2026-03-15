import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

interface RetryAttempt {
  id: string
  attempt: number
  max_attempts: number
  failure_stage: string  // "maker" | "checker"
  failure_reason: string
  failure_details?: string
  suggestions?: string[]
  created_at: string
}

export function useTaskRetries(taskId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['task-retries', taskId],
    queryFn: async () => {
      if (!taskId) return []

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('entity_id', taskId)
        .in('event_type', ['context.retry', 'validation.failed'])
        .order('created_at', { ascending: true })

      if (error) throw error

      type RetryEvent = { id: string; payload: Record<string, unknown> | null; created_at: string }
      return ((data || []) as RetryEvent[]).map((event) => ({
        id: event.id,
        attempt: event.payload?.attempt || 1,
        max_attempts: event.payload?.max_attempts || 3,
        failure_stage: event.payload?.failure_stage || 'unknown',
        failure_reason: event.payload?.failure_reason || 'Unknown error',
        failure_details: event.payload?.failure_details,
        suggestions: event.payload?.suggestions,
        created_at: event.created_at,
      })) as RetryAttempt[]
    },
    enabled: !!taskId,
  })
}
