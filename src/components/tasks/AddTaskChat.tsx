"use client"

import { useEffect, useRef, useState } from "react"
import { usePlanningChat } from "@/hooks/usePlanningChat"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ProgressIndicator, MessageBubble } from "@/components/planning"
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
    currentPhase,
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
            <MessageBubble key={message.id} message={message} maxWidth="max-w-[85%]" showSprintNumber />
          ))
        )}
        {currentPhase && (
          <ProgressIndicator phase={currentPhase} className="mx-auto max-w-md" />
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
