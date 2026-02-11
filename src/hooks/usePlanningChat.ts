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

  // Get existing conversation or create a temporary local ID.
  // The real conversation is created server-side by the backend
  // (Modal /planning/chat) which returns the conversation_id via SSE.
  const ensureConversation = useCallback(async (): Promise<string> => {
    if (conversationId) return conversationId

    // Use a temporary local ID until the backend returns the real one
    const tempId = crypto.randomUUID()
    setConversationId(tempId)
    setSession(createSession(tempId))
    return tempId
  }, [conversationId])

  // Messages are saved server-side by the backend (Modal /planning/chat).
  // No direct Supabase writes needed from the dashboard.

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
      setSession(prev => prev ? touchSession(prev) : prev)

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

        if (!response.ok) {
          const errorText = await response.text()
          console.error('[Planning] API error:', response.status, errorText)

          // Handle specific error codes
          if (response.status === 404) {
            // Session expired - clear backend ID and could retry
            setSession(prev => prev ? { ...prev, backendConversationId: null } : prev)
          }

          setIsStreaming(false)
          setIsLoading(false)
          throw new Error(`Planning API error: ${response.status}`)
        }

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
                if (data.conversation_id) {
                  console.log('[Planning] Received backend conversation_id:', data.conversation_id)
                  setConversationId(data.conversation_id as string)
                  setSession(prev => prev && !prev.backendConversationId ? setBackendConversationId(prev, data.conversation_id as string) : prev)
                }

                // Handle progress phase updates
                if (data.phase) {
                  setSession(prev => {
                    const sessionAwarePhase = getSessionAwarePhase(data.phase as string, prev)
                    setCurrentPhase({
                      phase: sessionAwarePhase,
                      message: (data.message as string) || "",
                      icon: (data.icon as string) || "spinner",
                      elapsed: data.elapsed as number | undefined,
                    })
                    // Touch session on any activity
                    return prev ? touchSession(prev) : prev
                  })
                  // Clear phase when complete
                  if (data.phase === "completed") {
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

                if (data.done) {
                  // Backend has already saved the message to Supabase
                  savedToDb = true
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

        // Backend saves messages server-side, no local save needed
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
  }, [currentRecommendation, conversationId, options, session])

  const reset = useCallback(async () => {
    // TODO: call backend API to mark conversation as abandoned if needed
    setMessages([])
    setConversationId(null)
    setCurrentRecommendation(null)
    setIsReadyForApproval(false)
  }, [])

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
