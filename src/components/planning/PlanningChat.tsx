"use client"

import { useEffect, useRef, useState } from "react"
import { usePlanningChat } from "@/hooks/usePlanningChat"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ChatMessage, DecompositionRecommendation } from "@/types"
import { cn } from "@/lib/utils"

interface PlanningChatProps {
  projectId?: string
  onApprove?: (recommendations: DecompositionRecommendation) => void
}

export function PlanningChat({ projectId, onApprove }: PlanningChatProps) {
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const {
    messages,
    isStreaming,
    isLoading,
    currentRecommendation,
    sendMessage,
    approveRecommendation,
    reset,
  } = usePlanningChat({ projectId, onApprove })

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
  }

  const handleClearHistory = async () => {
    if (confirm("Clear conversation history? This will start a fresh conversation.")) {
      await reset()
    }
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Planning Chat</CardTitle>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearHistory}
            disabled={isStreaming}
            className="text-muted-foreground hover:text-destructive"
          >
            Clear History
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-center px-4">
            <div>
              <p className="font-medium">Start planning your project</p>
              <p className="text-sm mt-1">
                Describe what you want to build and the Orchestrator will help you break it down into sprints and tasks.
              </p>
            </div>
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
          <div className="w-full flex gap-2">
            <Button onClick={handleApprove} className="flex-1">
              Approve Recommendations
            </Button>
            <Button variant="outline" className="flex-1">
              Reject & Refine
            </Button>
          </div>
        )}

        <div className="w-full flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build..."
            disabled={isStreaming}
          />
          <Button onClick={handleSend} disabled={isStreaming || !inputValue.trim()}>
            {isStreaming ? "Sending..." : "Send"}
          </Button>
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
          "max-w-[80%] rounded-lg px-4 py-2",
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
    <div className="mt-4 space-y-4 border-t pt-4">
      <div className="font-semibold text-sm">Proposed Decomposition:</div>

      {recommendations.sprints && recommendations.sprints.length > 0 && (
        <div className="space-y-3">
          {recommendations.sprints.map((sprint, idx) => (
            <div key={idx} className="bg-background/50 rounded p-3 space-y-2">
              <div className="font-medium">{sprint.name}</div>
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
