import { useState, useCallback, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { ChatMessage, DecompositionRecommendation } from "@/types"

interface UsePlanningChatOptions {
  projectId?: string
  sprintId?: string
  onApprove?: (recommendation: DecompositionRecommendation) => void
}

interface PlanningConversation {
  id: string
  project_id: string | null
  sprint_id: string | null
  status: string
}

interface PlanningMessage {
  id: string
  conversation_id: string
  role: string
  content: string
  recommendations: DecompositionRecommendation | null
  created_at: string
}

const MAX_HISTORY_MESSAGES = 20 // Send last N messages for context

export function usePlanningChat(options: UsePlanningChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentRecommendation, setCurrentRecommendation] = useState<DecompositionRecommendation | null>(null)

  const supabase = createClient()

  // Load existing conversation on mount
  useEffect(() => {
    async function loadConversation() {
      if (!options.projectId && !options.sprintId) {
        setIsLoading(false)
        return
      }

      try {
        // Find existing active conversation
        let query = supabase
          .from("planning_conversations")
          .select("id")
          .eq("status", "active")

        if (options.projectId) {
          query = query.eq("project_id", options.projectId)
        }
        if (options.sprintId) {
          query = query.eq("sprint_id", options.sprintId)
        }

        const { data: conversation } = await query.single<PlanningConversation>()

        if (conversation) {
          setConversationId(conversation.id)

          // Load messages for this conversation
          const { data: existingMessages } = await supabase
            .from("planning_messages")
            .select("id, role, content, recommendations, created_at")
            .eq("conversation_id", conversation.id)
            .order("created_at", { ascending: true })
            .returns<PlanningMessage[]>()

          if (existingMessages && existingMessages.length > 0) {
            const loadedMessages: ChatMessage[] = existingMessages.map((m: PlanningMessage) => ({
              id: m.id,
              role: m.role as "user" | "orchestrator",
              content: m.content,
              recommendations: m.recommendations as DecompositionRecommendation | undefined,
              createdAt: m.created_at,
            }))
            setMessages(loadedMessages)

            // Set current recommendation from last orchestrator message
            const lastOrchestratorMsg = [...loadedMessages]
              .reverse()
              .find((m) => m.role === "orchestrator" && m.recommendations)
            if (lastOrchestratorMsg?.recommendations) {
              setCurrentRecommendation(lastOrchestratorMsg.recommendations)
            }
          }
        }
      } catch (error) {
        console.error("Error loading conversation:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadConversation()
  }, [options.projectId, options.sprintId, supabase])

  // Create or get conversation
  const ensureConversation = useCallback(async (): Promise<string> => {
    if (conversationId) return conversationId

    const { data, error } = await supabase
      .from("planning_conversations")
      .insert({
        project_id: options.projectId || null,
        sprint_id: options.sprintId || null,
        status: "active",
      } as never)
      .select("id")
      .single<{ id: string }>()

    if (error) throw error
    setConversationId(data.id)
    return data.id
  }, [conversationId, options.projectId, options.sprintId, supabase])

  // Save message to database
  const saveMessage = useCallback(
    async (
      convId: string,
      role: "user" | "orchestrator",
      content: string,
      recommendations?: DecompositionRecommendation
    ): Promise<string> => {
      const { data, error } = await supabase
        .from("planning_messages")
        .insert({
          conversation_id: convId,
          role,
          content,
          recommendations: recommendations || null,
        } as never)
        .select("id")
        .single<{ id: string }>()

      if (error) throw error
      return data.id
    },
    [supabase]
  )

  // Get history for context (last N messages)
  const getHistoryForContext = useCallback(() => {
    return messages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
      role: m.role,
      content: m.content,
    }))
  }, [messages])

  const sendMessage = useCallback(
    async (content: string) => {
      // Ensure we have a conversation
      const convId = await ensureConversation()

      // Create user message
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMessage])
      setIsStreaming(true)

      // Save user message to DB
      const savedUserId = await saveMessage(convId, "user", content)
      userMessage.id = savedUserId

      // Create placeholder for assistant response
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "orchestrator",
        content: "",
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMessage])

      try {
        const history = getHistoryForContext()

        const response = await fetch("/api/planning", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: convId,
            message: content,
            history, // Include conversation history
            projectId: options.projectId,
            sprintId: options.sprintId,
          }),
        })

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) throw new Error("No response stream")

        let fullContent = ""
        let recommendations: DecompositionRecommendation | undefined
        let buffer = "" // Buffer for incomplete SSE chunks
        let savedToDb = false // Track if we already saved to avoid duplicates

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          // Append new data to buffer
          buffer += decoder.decode(value, { stream: true })

          // Process complete SSE messages (separated by double newline)
          const messages = buffer.split("\n\n")
          // Keep the last potentially incomplete message in buffer
          buffer = messages.pop() || ""

          for (const message of messages) {
            const lines = message.split("\n")
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6))

                if (data.content) {
                  fullContent += data.content
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessage.id ? { ...m, content: fullContent } : m
                    )
                  )
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
                  recommendations = data.recommendations
                  setCurrentRecommendation(data.recommendations)
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessage.id
                        ? { ...m, recommendations: data.recommendations }
                        : m
                    )
                  )
                }

                if (data.done && !savedToDb) {
                  // Save orchestrator message to DB
                  const savedAssistantId = await saveMessage(
                    convId,
                    "orchestrator",
                    fullContent,
                    recommendations
                  )
                  savedToDb = true
                  // Update the message ID to the saved one
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessage.id ? { ...m, id: savedAssistantId } : m
                    )
                  )
                }
                } catch {
                  // Skip invalid JSON
                }
              }
            }
          }
        }

        // Process any remaining buffer content
        if (buffer.trim()) {
          const lines = buffer.split("\n")
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.content) {
                  fullContent += data.content
                }
                if (data.chunk) {
                  fullContent += data.chunk
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        // If we didn't get a done signal, save anyway (but only if not already saved)
        if (fullContent && !savedToDb) {
          const savedAssistantId = await saveMessage(
            convId,
            "orchestrator",
            fullContent,
            recommendations
          )
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id ? { ...m, id: savedAssistantId } : m
            )
          )
        }
      } catch (error) {
        console.error("Error sending message:", error)
        // Remove the failed assistant message
        setMessages((prev) => prev.filter((m) => m.id !== assistantMessage.id))
      } finally {
        setIsStreaming(false)
      }
    },
    [
      ensureConversation,
      saveMessage,
      getHistoryForContext,
      options.projectId,
      options.sprintId,
    ]
  )

  const approveRecommendation = useCallback(async () => {
    if (!currentRecommendation || !conversationId) return

    // Update conversation status
    await supabase
      .from("planning_conversations")
      .update({ status: "approved", completed_at: new Date().toISOString() } as never)
      .eq("id", conversationId)

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
  }, [currentRecommendation, conversationId, options, supabase])

  const reset = useCallback(async () => {
    // Mark current conversation as abandoned if exists
    if (conversationId) {
      await supabase
        .from("planning_conversations")
        .update({ status: "abandoned" } as never)
        .eq("id", conversationId)
    }

    setMessages([])
    setConversationId(null)
    setCurrentRecommendation(null)
  }, [conversationId, supabase])

  return {
    messages,
    isStreaming,
    isLoading,
    currentRecommendation,
    sendMessage,
    approveRecommendation,
    reset,
    conversationId,
  }
}
