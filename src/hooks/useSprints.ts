import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { SprintSummary } from '@/lib/supabase/types'

export function useSprints(projectId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['sprints', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sprint_summary')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index')

      if (error) throw error
      return data as SprintSummary[]
    },
    enabled: !!projectId,
  })
}
