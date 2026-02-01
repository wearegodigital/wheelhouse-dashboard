import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

export function useRealtimeSubscription(
  table: string,
  queryKey: string[],
  filter?: { column: string; value: string }
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const supabase = createClient()

    const config = {
      event: "*" as const,
      schema: "public" as const,
      table,
      ...(filter && { filter: `${filter.column}=eq.${filter.value}` }),
    }

    const channel: RealtimeChannel = supabase
      .channel(`${table}_changes`)
      .on("postgres_changes", config, () => {
        queryClient.invalidateQueries({ queryKey })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, JSON.stringify(queryKey), filter?.column, filter?.value, queryClient])
}
