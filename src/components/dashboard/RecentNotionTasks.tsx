"use client"

import Link from "next/link"
import { useNotionTasks } from "@/hooks/useNotionTasks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowRight, Inbox } from "lucide-react"

export function RecentNotionTasks() {
  const { data: tasks, isLoading } = useNotionTasks("to_delegate")

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Inbox className="h-4 w-4" /> To Delegate
        </CardTitle>
        <Link href="/delegate" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
        ) : !tasks?.length ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No tasks to delegate</p>
        ) : (
          tasks.slice(0, 10).map((task) => (
            <Link key={task.id} href={`/delegate/${task.notion_page_id}/process`} className="block">
              <div className="p-2 rounded-md hover:bg-accent/30 transition-all">
                <p className="text-sm font-medium truncate">{task.title || "Untitled"}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>{task.client_name || "Unknown client"}</span>
                  {task.priority && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">{task.priority}</Badge>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  )
}
