'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CheckCircle,
  XCircle,
  Code,
  Shield,
  GitPullRequest,
  FileText,
  Clock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import type { AgentSummary } from '@/hooks/useAgentSummaries'

const ROLE_CONFIG: Record<string, { icon: typeof Code; label: string; color: string }> = {
  maker: { icon: Code, label: 'Maker', color: 'text-blue-500' },
  checker: { icon: Shield, label: 'Checker', color: 'text-amber-500' },
  joiner: { icon: GitPullRequest, label: 'Joiner', color: 'text-purple-500' },
  documenter: { icon: FileText, label: 'Documenter', color: 'text-green-500' },
}

function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

interface AgentSummaryCardProps {
  summary: AgentSummary
}

export function AgentSummaryCard({ summary }: AgentSummaryCardProps) {
  const [expanded, setExpanded] = useState(false)
  const config = ROLE_CONFIG[summary.agent_role] ?? ROLE_CONFIG.maker
  const Icon = config.icon
  const StatusIcon = summary.success ? CheckCircle : XCircle

  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="pb-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${config.color}`} />
            <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
            <StatusIcon className={`h-4 w-4 ${summary.success ? 'text-green-500' : 'text-destructive'}`} />
            <Badge variant={summary.success ? 'default' : 'destructive'} className="text-xs">
              {summary.success ? 'Passed' : 'Failed'}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDuration(summary.started_at, summary.completed_at)}
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground">{summary.summary}</p>

        {expanded && (
          <div className="mt-3 space-y-2">
            {summary.files_modified.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1">Files Modified</p>
                <div className="flex flex-wrap gap-1">
                  {summary.files_modified.map((file) => (
                    <code key={file} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {file}
                    </code>
                  ))}
                </div>
              </div>
            )}

            {summary.key_decisions.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1">Key Decisions</p>
                <ul className="text-xs text-muted-foreground list-disc pl-4">
                  {summary.key_decisions.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            )}

            {summary.issues_encountered.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1">Issues</p>
                <ul className="text-xs text-destructive/80 list-disc pl-4">
                  {summary.issues_encountered.map((issue, i) => <li key={i}>{issue}</li>)}
                </ul>
              </div>
            )}

            {summary.error && (
              <div>
                <p className="text-xs font-medium mb-1 text-destructive">Error</p>
                <pre className="text-xs bg-destructive/5 p-2 rounded overflow-x-auto max-h-24">
                  {summary.error}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
