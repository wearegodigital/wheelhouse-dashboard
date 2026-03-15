'use client'

import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { useRealtimeSubscription } from './useRealtimeSubscription'

export interface AgentSummary {
  id: string
  agent_id: string
  agent_role: string
  task_id: string
  sprint_id: string | null
  started_at: string
  completed_at: string
  success: boolean
  summary: string
  files_modified: string[]
  key_decisions: string[]
  issues_encountered: string[]
  error: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export function useAgentSummaries(taskId: string | undefined) {
  const supabase = createClient()

  // Subscribe to realtime updates for this task's summaries
  useRealtimeSubscription(
    taskId ? 'agent_summaries' : 'agent_summaries',
    ['agent-summaries', taskId ?? ''],
    taskId ? { column: 'task_id', value: taskId } : undefined,
  )

  return useQuery({
    queryKey: ['agent-summaries', taskId],
    queryFn: async () => {
      if (!taskId) return []

      const { data, error } = await supabase
        .from('agent_summaries')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return (data || []) as AgentSummary[]
    },
    enabled: !!taskId,
  })
}
