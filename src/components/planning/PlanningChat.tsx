"use client"

import { useEffect, useRef, useState } from "react"
import { usePlanningChat } from "@/hooks/usePlanningChat"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProgressIndicator } from "./ProgressIndicator"
import { MessageBubble } from "./MessageBubble"
import type { DecompositionRecommendation } from "@/types"

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
    currentPhase,
    sendMessage,
    approveRecommendation,
    reset,
  } = usePlanningChat({ projectId, onApprove })

  // Auto-scroll to bottom when new messages arrive or phase changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, currentPhase])

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
            Loading...
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
        {currentPhase && (
          <ProgressIndicator phase={currentPhase} className="mx-auto max-w-md" />
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      <CardFooter className="flex-col gap-4">
        {currentRecommendation && (
          <div className="w-full flex gap-2">
            <Button onClick={approveRecommendation} className="flex-1">
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
