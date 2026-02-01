import { useState, useCallback } from "react"
import type { ChatMessage, DecompositionRecommendation } from "@/types"

interface UsePlanningChatOptions {
  projectId?: string
  sprintId?: string
  onApprove?: (recommendation: DecompositionRecommendation) => void
}

export function usePlanningChat(options: UsePlanningChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentRecommendation, setCurrentRecommendation] = useState<DecompositionRecommendation | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsStreaming(true)

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "orchestrator",
      content: "",
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      const response = await fetch("/api/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: content,
          projectId: options.projectId,
          sprintId: options.sprintId,
        }),
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error("No response stream")

      let fullContent = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.conversationId) {
                setConversationId(data.conversationId)
              }

              if (data.chunk) {
                fullContent += data.chunk
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id ? { ...m, content: fullContent } : m
                  )
                )
              }

              if (data.recommendations) {
                setCurrentRecommendation(data.recommendations)
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, recommendations: data.recommendations }
                      : m
                  )
                )
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      setIsStreaming(false)
    }
  }, [conversationId, options.projectId, options.sprintId])

  const approveRecommendation = useCallback(async () => {
    if (!currentRecommendation || !conversationId) return

    await fetch("/api/planning/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        projectId: options.projectId,
        sprintId: options.sprintId,
        recommendation: currentRecommendation,
      }),
    })

    options.onApprove?.(currentRecommendation)
  }, [currentRecommendation, conversationId, options])

  const reset = useCallback(() => {
    setMessages([])
    setConversationId(null)
    setCurrentRecommendation(null)
  }, [])

  return {
    messages,
    isStreaming,
    currentRecommendation,
    sendMessage,
    approveRecommendation,
    reset,
    conversationId,
  }
}
