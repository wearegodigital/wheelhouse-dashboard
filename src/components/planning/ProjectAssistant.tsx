"use client"

import { useState, useRef, useEffect } from "react"
import { usePlanningChat } from "@/hooks/usePlanningChat"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Send, Bot, Loader2 } from "lucide-react"

interface ProjectAssistantProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
}

export function ProjectAssistant({ projectId, isOpen, onClose }: ProjectAssistantProps) {
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const {
    messages,
    isStreaming,
    isLoading,
    sendMessage,
  } = usePlanningChat({ projectId, skipHistory: true })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return
    const text = inputValue
    setInputValue("")
    await sendMessage(text)
  }

  if (!isOpen) return null

  return (
    <div className="fixed right-0 top-0 h-full w-[400px] z-50 shadow-2xl border-l bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Project Assistant</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Ask me to help manage this project.</p>
            <p className="text-xs mt-1">I can create tasks, modify sprints, review plans, and more.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.content || (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
              </div>
            </div>
          ))
        )}
        {isStreaming && messages.length > 0 && messages[messages.length - 1].content === "" && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Ask the assistant..."
            disabled={isStreaming}
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isStreaming}
            size="icon"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
