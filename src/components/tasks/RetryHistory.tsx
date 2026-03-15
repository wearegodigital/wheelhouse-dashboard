'use client'

import { useTaskRetries } from '@/hooks/useTaskRetries'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface RetryHistoryProps {
  taskId: string
}

export function RetryHistory({ taskId }: RetryHistoryProps) {
  const { data: retries, isLoading } = useTaskRetries(taskId)

  if (isLoading || !retries || retries.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry History ({retries.length} attempt{retries.length !== 1 ? 's' : ''})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {retries.map((retry) => (
          <div key={retry.id} className="flex gap-3 text-sm">
            <div className="flex flex-col items-center">
              <div className="rounded-full p-1 bg-destructive/10">
                <AlertTriangle className="h-3 w-3 text-destructive" />
              </div>
              <div className="w-px h-full bg-border" />
            </div>
            <div className="flex-1 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  Attempt {retry.attempt}/{retry.max_attempts}
                </Badge>
                <Badge variant="destructive" className="text-xs">
                  {retry.failure_stage} failed
                </Badge>
              </div>
              <p className="text-muted-foreground">{retry.failure_reason}</p>
              {retry.failure_details && (
                <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto max-h-24">
                  {retry.failure_details}
                </pre>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
