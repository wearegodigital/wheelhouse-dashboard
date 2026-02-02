import { useEffect, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

export function useRealtimeSubscription(
  table: string,
  queryKey: string[],
  filter?: { column: string; value: string }
) {
  const queryClient = useQueryClient()

  // Memoize queryKey string to avoid complex expression in dependency array
  const queryKeyString = useMemo(() => JSON.stringify(queryKey), [queryKey])
  const filterColumn = filter?.column
  const filterValue = filter?.value

  useEffect(() => {
    const supabase = createClient()

    const config = {
      event: "*" as const,
      schema: "public" as const,
      table,
      ...(filterColumn && filterValue && { filter: `${filterColumn}=eq.${filterValue}` }),
    }

    const channel: RealtimeChannel = supabase
      .channel(`${table}_changes`)
      .on("postgres_changes", config, () => {
        queryClient.invalidateQueries({ queryKey: JSON.parse(queryKeyString) })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, queryKeyString, filterColumn, filterValue, queryClient])
}
