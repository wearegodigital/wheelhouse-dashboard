"use client"

import { useEffect, useRef, useState } from "react"
import { usePlanningChat } from "@/hooks/usePlanningChat"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { ChatMessage, DecompositionRecommendation } from "@/types"
import { cn } from "@/lib/utils"
import { CheckCircle2, Lightbulb } from "lucide-react"

interface AddTaskChatProps {
  initialMessage: string
  projectId?: string
  suggestedLevel: "project" | "sprint" | "task"
  onComplete?: () => void
}

export function AddTaskChat({
  initialMessage,
  projectId,
  suggestedLevel,
  onComplete,
}: AddTaskChatProps) {
  const [inputValue, setInputValue] = useState("")
  const [hasSentInitial, setHasSentInitial] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    isStreaming,
    isLoading,
    currentRecommendation,
    sendMessage,
    approveRecommendation,
  } = usePlanningChat({ projectId })

  // Send initial message on mount
  useEffect(() => {
    if (!hasSentInitial && !isLoading && initialMessage) {
      setHasSentInitial(true)
      sendMessage(initialMessage)
    }
  }, [hasSentInitial, isLoading, initialMessage, sendMessage])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return
    await sendMessage(inputValue)
    setInputValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleApprove = async () => {
    await approveRecommendation()
    onComplete?.()
  }

  return (
    <Card className="flex flex-col h-[700px]">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Planning with Orchestrator</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Discuss your requirements and refine the task breakdown
          </p>
        </div>
        <Badge variant="secondary">
          Suggested: {suggestedLevel}
        </Badge>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="animate-pulse">Starting conversation...</div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      <CardFooter className="flex-col gap-4">
        {currentRecommendation && (
          <div className="w-full p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium text-green-700 dark:text-green-400">
                Ready to create
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              The Orchestrator has proposed a breakdown. Review it above and approve when ready.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleApprove} className="flex-1">
                Approve & Create
              </Button>
              <Button variant="outline" className="flex-1">
                Continue Refining
              </Button>
            </div>
          </div>
        )}

        <div className="w-full">
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
            <Lightbulb className="h-3 w-3" />
            <span>The Orchestrator may suggest a different decomposition level if appropriate</span>
          </div>
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask questions or provide more details..."
              disabled={isStreaming}
            />
            <Button onClick={handleSend} disabled={isStreaming || !inputValue.trim()}>
              {isStreaming ? "..." : "Send"}
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

interface MessageBubbleProps {
  message: ChatMessage
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-4 py-2",
          isUser
            ? "bg-primary text-primary-foreground ml-auto"
            : "bg-muted text-foreground mr-auto"
        )}
      >
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>

        {message.recommendations && (
          <RecommendationsDisplay recommendations={message.recommendations} />
        )}
      </div>
    </div>
  )
}

interface RecommendationsDisplayProps {
  recommendations: DecompositionRecommendation
}

function RecommendationsDisplay({ recommendations }: RecommendationsDisplayProps) {
  return (
    <div className="mt-4 space-y-4 border-t border-primary/20 pt-4">
      <div className="font-semibold text-sm">Proposed Breakdown:</div>

      {recommendations.sprints && recommendations.sprints.length > 0 && (
        <div className="space-y-3">
          {recommendations.sprints.map((sprint, idx) => (
            <div key={idx} className="bg-background/50 rounded p-3 space-y-2">
              <div className="font-medium">Sprint {idx + 1}: {sprint.name}</div>
              <div className="text-xs opacity-80">{sprint.description}</div>
              <div className="space-y-1">
                {sprint.tasks.map((task, taskIdx) => (
                  <div
                    key={taskIdx}
                    className="text-xs pl-3 border-l-2 border-primary/30 py-1"
                  >
                    <div>{task.description}</div>
                    <div className="opacity-60 mt-0.5">
                      Complexity: {task.estimatedComplexity}
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
              <div>{task.description}</div>
              <div className="opacity-60 mt-1">Complexity: {task.estimatedComplexity}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
