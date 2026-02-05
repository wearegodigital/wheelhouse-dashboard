import { useState, useCallback, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import type { ChatMessage, DecompositionRecommendation } from "@/types"
import {
  PlanningSession,
  createSession,
  touchSession,
  setBackendConversationId,
  getSessionAwarePhase
} from "@/lib/planning-session"

// Parse SSE line and return data object or null
function parseSSEData(line: string): Record<string, unknown> | null {
  if (!line.startsWith("data: ")) return null
  try {
    return JSON.parse(line.slice(6))
  } catch {
    return null
  }
}

export interface ProgressPhase {
  phase: string
  message: string
  icon: string
  elapsed?: number
}

interface UsePlanningChatOptions {
  projectId?: string
  sprintId?: string
  skipHistory?: boolean
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
  const [currentPhase, setCurrentPhase] = useState<ProgressPhase | null>(null)
  const [session, setSession] = useState<PlanningSession | null>(null)
  const [isReadyForApproval, setIsReadyForApproval] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  // Helper to update a specific message by ID
  const updateMessageById = useCallback((id: string, updates: Partial<ChatMessage>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    )
  }, [])

  // Load existing conversation on mount
  useEffect(() => {
    async function loadConversation() {
      if (!options.projectId && !options.sprintId) {
        setIsLoading(false)
        return
      }

      if (options.skipHistory) {
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
          setSession(createSession(conversation.id))

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
  }, [options.projectId, options.sprintId, options.skipHistory, supabase])

  // Fallback: if we have recommendations but no ready_for_approval signal,
  // assume ready after streaming completes (backward compatibility)
  useEffect(() => {
    if (currentRecommendation && !isStreaming && !isReadyForApproval) {
      const timer = setTimeout(() => setIsReadyForApproval(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [currentRecommendation, isStreaming, isReadyForApproval])

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
    setSession(createSession(data.id))
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
      // Touch session on message send
      if (session) {
        setSession(touchSession(session))
      }

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
            // Send backend session ID if we have it, otherwise null for new session
            conversationId: session?.backendConversationId || null,
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
            for (const line of message.split("\n")) {
              const data = parseSSEData(line)
              if (data) {
                try {

                // Capture backend conversation_id from first SSE event
                if (data.conversation_id && session && !session.backendConversationId) {
                  console.log('[Planning] Received backend conversation_id:', data.conversation_id)
                  setSession(setBackendConversationId(session, data.conversation_id as string))
                }

                // Handle progress phase updates
                if (data.phase) {
                  const sessionAwarePhase = getSessionAwarePhase(data.phase as string, session)
                  setCurrentPhase({
                    phase: sessionAwarePhase,
                    message: (data.message as string) || "",
                    icon: (data.icon as string) || "spinner",
                    elapsed: data.elapsed as number | undefined,
                  })
                  // Touch session on any activity
                  if (session) {
                    setSession(touchSession(session))
                  }
                  // Clear phase when complete
                  if (data.phase === "complete") {
                    setTimeout(() => setCurrentPhase(null), 1000)
                  }
                }

                // Handle content streaming (supports both content and chunk keys)
                const textChunk = data.content || data.chunk
                if (textChunk) {
                  // Clear phase once we start receiving content
                  setCurrentPhase(null)
                  fullContent += textChunk as string
                  updateMessageById(assistantMessage.id, { content: fullContent })
                }

                // Check if orchestrator signals ready for approval
                if (data.ready_for_approval === true) {
                  setIsReadyForApproval(true)
                }

                if (data.recommendations) {
                  recommendations = data.recommendations as DecompositionRecommendation
                  setCurrentRecommendation(recommendations)
                  updateMessageById(assistantMessage.id, { recommendations })
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
                  updateMessageById(assistantMessage.id, { id: savedAssistantId })
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
          for (const line of buffer.split("\n")) {
            const data = parseSSEData(line)
            if (data) {
              const textChunk = data.content || data.chunk
              if (textChunk) fullContent += textChunk as string
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
          updateMessageById(assistantMessage.id, { id: savedAssistantId })
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
      updateMessageById,
      options.projectId,
      options.sprintId,
      session,
    ]
  )

  const approveRecommendation = useCallback(async (): Promise<{
    projectId?: string
    verification?: {
      verified: boolean
      message?: string
    }
  } | undefined> => {
    if (!currentRecommendation || !conversationId) return

    // Update conversation status
    await supabase
      .from("planning_conversations")
      .update({ status: "approved", completed_at: new Date().toISOString() } as never)
      .eq("id", conversationId)

    const response = await fetch("/api/planning/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: session?.backendConversationId,  // Backend session ID
        supabaseConversationId: conversationId,          // Local DB record ID
        projectId: options.projectId,
        sprintId: options.sprintId,
        recommendation: currentRecommendation,
      }),
    })

    const result = await response.json()
    options.onApprove?.(currentRecommendation)

    return {
      projectId: result.projectId || options.projectId,
      verification: result.verification ? {
        verified: result.verification.verified,
        message: result.verification.verified
          ? undefined
          : `${result.verification.successful}/${result.verification.total} entities synced. Some may still be syncing.`
      } : undefined
    }
  }, [currentRecommendation, conversationId, options, supabase, session])

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
    setIsReadyForApproval(false)
  }, [conversationId, supabase])

  return {
    messages,
    isStreaming,
    isLoading,
    currentRecommendation,
    currentPhase,
    session,
    isReadyForApproval,
    sendMessage,
    approveRecommendation,
    reset,
    conversationId,
  }
}
