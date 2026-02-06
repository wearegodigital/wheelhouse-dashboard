"use client"

import type { ChatMessage, DecompositionRecommendation } from "@/types"
import { cn } from "@/lib/utils"

interface MessageBubbleProps {
  message: ChatMessage
  maxWidth?: string
  showSprintNumber?: boolean
}

export function MessageBubble({ message, maxWidth = "max-w-[80%]", showSprintNumber = false }: MessageBubbleProps) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "rounded-lg px-4 py-2",
          maxWidth,
          isUser
            ? "bg-primary text-primary-foreground ml-auto"
            : "bg-muted text-foreground mr-auto"
        )}
      >
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        {message.recommendations && (
          <RecommendationsDisplay recommendations={message.recommendations} showSprintNumber={showSprintNumber} />
        )}
      </div>
    </div>
  )
}

interface RecommendationsDisplayProps {
  recommendations: DecompositionRecommendation
  showSprintNumber?: boolean
}

export function RecommendationsDisplay({
  recommendations,
  showSprintNumber = false
}: RecommendationsDisplayProps) {
  return (
    <div className="mt-4 space-y-4 border-t border-primary/20 pt-4">
      <div className="font-semibold text-sm">Proposed Breakdown:</div>

      {recommendations.sprints && recommendations.sprints.length > 0 && (
        <div className="space-y-3">
          {recommendations.sprints.map((sprint, idx) => (
            <div key={idx} className="bg-background/50 rounded p-3 space-y-2">
              <div className="font-medium">
                {showSprintNumber ? `Sprint ${idx + 1}: ` : ""}{sprint.name}
              </div>
              <div className="text-xs opacity-80">{sprint.description}</div>
              <div className="space-y-1">
                {(sprint.tasks ?? []).map((task, taskIdx) => (
                  <div
                    key={taskIdx}
                    className="text-xs pl-3 border-l-2 border-primary/30 py-1"
                  >
                    <div className="font-medium">{task.title}</div>
                    {task.description && <div className="opacity-80">{task.description}</div>}
                    <div className="opacity-60 mt-0.5">
                      Complexity: {task.complexity ?? "medium"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {recommendations.tasks && recommendations.tasks.length > 0 && !recommendations.sprints && (
        <div className="space-y-2">
          {recommendations.tasks.map((task, idx) => (
            <div key={idx} className="bg-background/50 rounded p-2 text-xs">
              <div className="font-medium">{task.title}</div>
              {task.description && <div className="opacity-80">{task.description}</div>}
              <div className="opacity-60 mt-1">Complexity: {task.complexity ?? "medium"}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
