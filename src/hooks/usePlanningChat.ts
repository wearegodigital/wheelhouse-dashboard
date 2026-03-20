import { useReducer, useCallback, useEffect, useMemo } from "react"
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

// --- Reducer types ---

interface PlanningState {
  messages: ChatMessage[]
  conversationId: string | null
  isStreaming: boolean
  isLoading: boolean
  currentRecommendation: DecompositionRecommendation | null
  currentPhase: ProgressPhase | null
  session: PlanningSession | null
  isReadyForApproval: boolean
}

type PlanningAction =
  | { type: "SEND_MESSAGE"; payload: ChatMessage }
  | { type: "RECEIVE_CHUNK"; payload: { messageId: string; content: string; recommendations?: DecompositionRecommendation } }
  | { type: "SET_PHASE"; payload: ProgressPhase | null }
  | { type: "SET_CONVERSATION_ID"; payload: { conversationId: string; session?: PlanningSession } }
  | { type: "SET_RECOMMENDATIONS"; payload: DecompositionRecommendation }
  | { type: "APPROVE_START" }
  | { type: "APPROVE_COMPLETE" }
  | { type: "ERROR"; payload: { assistantMessageId: string } }
  | { type: "RESET" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_STREAMING"; payload: boolean }
  | { type: "SET_READY_FOR_APPROVAL"; payload: boolean }
  | { type: "LOAD_CONVERSATION"; payload: { conversationId: string; messages: ChatMessage[]; recommendation: DecompositionRecommendation | null; session: PlanningSession } }
  | { type: "SET_SESSION"; payload: PlanningSession | null }
  | { type: "TOUCH_SESSION" }
  | { type: "CLEAR_BACKEND_SESSION" }

const initialState: PlanningState = {
  messages: [],
  conversationId: null,
  isStreaming: false,
  isLoading: true,
  currentRecommendation: null,
  currentPhase: null,
  session: null,
  isReadyForApproval: false,
}

function planningReducer(state: PlanningState, action: PlanningAction): PlanningState {
  switch (action.type) {
    case "SEND_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
      }

    case "RECEIVE_CHUNK": {
      const { messageId, content, recommendations } = action.payload
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === messageId
            ? { ...m, content, ...(recommendations ? { recommendations } : {}) }
            : m
        ),
        ...(recommendations ? { currentRecommendation: recommendations } : {}),
      }
    }

    case "SET_PHASE":
      return { ...state, currentPhase: action.payload }

    case "SET_CONVERSATION_ID":
      return {
        ...state,
        conversationId: action.payload.conversationId,
        ...(action.payload.session ? { session: action.payload.session } : {}),
      }

    case "SET_RECOMMENDATIONS":
      return { ...state, currentRecommendation: action.payload }

    case "APPROVE_START":
      return state

    case "APPROVE_COMPLETE":
      return state

    case "ERROR":
      return {
        ...state,
        messages: state.messages.filter((m) => m.id !== action.payload.assistantMessageId),
        isStreaming: false,
      }

    case "RESET":
      return {
        ...state,
        messages: [],
        conversationId: null,
        currentRecommendation: null,
        isReadyForApproval: false,
      }

    case "SET_LOADING":
      return { ...state, isLoading: action.payload }

    case "SET_STREAMING":
      return { ...state, isStreaming: action.payload }

    case "SET_READY_FOR_APPROVAL":
      return { ...state, isReadyForApproval: action.payload }

    case "LOAD_CONVERSATION":
      return {
        ...state,
        conversationId: action.payload.conversationId,
        messages: action.payload.messages,
        currentRecommendation: action.payload.recommendation,
        session: action.payload.session,
        isLoading: false,
      }

    case "SET_SESSION":
      return { ...state, session: action.payload }

    case "TOUCH_SESSION":
      return {
        ...state,
        session: state.session ? touchSession(state.session) : null,
      }

    case "CLEAR_BACKEND_SESSION":
      return {
        ...state,
        session: state.session ? { ...state.session, backendConversationId: null } : null,
      }

    default:
      return state
  }
}

// --- Hook ---

export function usePlanningChat(options: UsePlanningChatOptions = {}) {
  const [state, dispatch] = useReducer(planningReducer, initialState)

  const supabase = useMemo(() => createClient(), [])

  // Load existing conversation on mount
  useEffect(() => {
    async function loadConversation() {
      if (!options.projectId && !options.sprintId) {
        dispatch({ type: "SET_LOADING", payload: false })
        return
      }

      if (options.skipHistory) {
        dispatch({ type: "SET_LOADING", payload: false })
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
          // Load messages for this conversation
          const { data: existingMessages } = await supabase
            .from("planning_messages")
            .select("id, role, content, recommendations, created_at")
            .eq("conversation_id", conversation.id)
            .order("created_at", { ascending: true })
            .returns<PlanningMessage[]>()

          let loadedMessages: ChatMessage[] = []
          let recommendation: DecompositionRecommendation | null = null

          if (existingMessages && existingMessages.length > 0) {
            loadedMessages = existingMessages.map((m: PlanningMessage) => ({
              id: m.id,
              role: m.role as "user" | "orchestrator",
              content: m.content,
              recommendations: m.recommendations as DecompositionRecommendation | undefined,
              createdAt: m.created_at,
            }))

            // Set current recommendation from last orchestrator message
            const lastOrchestratorMsg = [...loadedMessages]
              .reverse()
              .find((m) => m.role === "orchestrator" && m.recommendations)
            if (lastOrchestratorMsg?.recommendations) {
              recommendation = lastOrchestratorMsg.recommendations
            }
          }

          dispatch({
            type: "LOAD_CONVERSATION",
            payload: {
              conversationId: conversation.id,
              messages: loadedMessages,
              recommendation,
              session: createSession(conversation.id),
            },
          })
        } else {
          dispatch({ type: "SET_LOADING", payload: false })
        }
      } catch (error) {
        console.error("Error loading conversation:", error)
        dispatch({ type: "SET_LOADING", payload: false })
      }
    }

    loadConversation()
  }, [options.projectId, options.sprintId, options.skipHistory, supabase])

  // Fallback: if we have recommendations but no ready_for_approval signal,
  // assume ready after streaming completes (backward compatibility)
  useEffect(() => {
    if (state.currentRecommendation && !state.isStreaming && !state.isReadyForApproval) {
      const timer = setTimeout(() => dispatch({ type: "SET_READY_FOR_APPROVAL", payload: true }), 1000)
      return () => clearTimeout(timer)
    }
  }, [state.currentRecommendation, state.isStreaming, state.isReadyForApproval])

  // Get existing conversation or create a temporary local ID.
  // The real conversation is created server-side by the backend
  // (Modal /planning/chat) which returns the conversation_id via SSE.
  const ensureConversation = useCallback(async (): Promise<string> => {
    if (state.conversationId) return state.conversationId

    // Use a temporary local ID until the backend returns the real one
    const tempId = crypto.randomUUID()
    dispatch({
      type: "SET_CONVERSATION_ID",
      payload: { conversationId: tempId, session: createSession(tempId) },
    })
    return tempId
  }, [state.conversationId])

  // Messages are saved server-side by the backend (Modal /planning/chat).
  // No direct Supabase writes needed from the dashboard.

  // Get history for context (last N messages)
  const getHistoryForContext = useCallback(() => {
    return state.messages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
      role: m.role,
      content: m.content,
    }))
  }, [state.messages])

  const sendMessage = useCallback(
    async (content: string) => {
      // Touch session on message send
      dispatch({ type: "TOUCH_SESSION" })

      // Ensure we have a conversation
      await ensureConversation()

      // Create user message
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      }
      dispatch({ type: "SEND_MESSAGE", payload: userMessage })
      dispatch({ type: "SET_STREAMING", payload: true })

      // Create placeholder for assistant response
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "orchestrator",
        content: "",
        createdAt: new Date().toISOString(),
      }
      dispatch({ type: "SEND_MESSAGE", payload: assistantMessage })

      try {
        const history = getHistoryForContext()

        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        const response = await fetch("/api/planning", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            // Send backend session ID if we have it, otherwise null for new session
            conversationId: state.session?.backendConversationId || null,
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
            dispatch({ type: "CLEAR_BACKEND_SESSION" })
          }

          dispatch({ type: "SET_STREAMING", payload: false })
          dispatch({ type: "SET_LOADING", payload: false })
          throw new Error(`Planning API error: ${response.status}`)
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) throw new Error("No response stream")

        let fullContent = ""
        let recommendations: DecompositionRecommendation | undefined
        let buffer = "" // Buffer for incomplete SSE chunks

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          // Append new data to buffer
          buffer += decoder.decode(value, { stream: true })

          // Process complete SSE messages (separated by double newline)
          const sseMessages = buffer.split("\n\n")
          // Keep the last potentially incomplete message in buffer
          buffer = sseMessages.pop() || ""

          for (const sseMessage of sseMessages) {
            for (const line of sseMessage.split("\n")) {
              const data = parseSSEData(line)
              if (data) {
                try {

                // Capture backend conversation_id from first SSE event
                if (data.conversation_id) {
                  console.log('[Planning] Received backend conversation_id:', data.conversation_id)
                  const backendId = data.conversation_id as string
                  dispatch({
                    type: "SET_CONVERSATION_ID",
                    payload: { conversationId: backendId },
                  })
                  // Set backend conversation ID on session if not already set
                  dispatch({
                    type: "SET_SESSION",
                    payload: state.session && !state.session.backendConversationId
                      ? setBackendConversationId(state.session, backendId)
                      : state.session,
                  })
                }

                // Handle progress phase updates
                if (data.phase) {
                  const sessionAwarePhase = getSessionAwarePhase(data.phase as string, state.session)
                  dispatch({
                    type: "SET_PHASE",
                    payload: {
                      phase: sessionAwarePhase,
                      message: (data.message as string) || "",
                      icon: (data.icon as string) || "spinner",
                      elapsed: data.elapsed as number | undefined,
                    },
                  })
                  dispatch({ type: "TOUCH_SESSION" })
                  // Clear phase when complete
                  if (data.phase === "completed") {
                    setTimeout(() => dispatch({ type: "SET_PHASE", payload: null }), 1000)
                  }
                }

                // Handle content streaming (supports both content and chunk keys)
                const textChunk = data.content || data.chunk
                if (textChunk) {
                  // Clear phase once we start receiving content
                  dispatch({ type: "SET_PHASE", payload: null })
                  fullContent += textChunk as string
                  dispatch({
                    type: "RECEIVE_CHUNK",
                    payload: { messageId: assistantMessage.id, content: fullContent },
                  })
                }

                // Check if orchestrator signals ready for approval
                if (data.ready_for_approval === true) {
                  dispatch({ type: "SET_READY_FOR_APPROVAL", payload: true })
                }

                if (data.recommendations) {
                  recommendations = data.recommendations as DecompositionRecommendation
                  dispatch({ type: "SET_RECOMMENDATIONS", payload: recommendations })
                  dispatch({
                    type: "RECEIVE_CHUNK",
                    payload: { messageId: assistantMessage.id, content: fullContent, recommendations },
                  })
                }

                if (data.done) {
                  // Backend has already saved the message to Supabase
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
        dispatch({ type: "ERROR", payload: { assistantMessageId: assistantMessage.id } })
      } finally {
        dispatch({ type: "SET_STREAMING", payload: false })
      }
    },
    [
      ensureConversation,
      getHistoryForContext,
      options.projectId,
      options.sprintId,
      state.session,
    ]
  )

  const approveRecommendation = useCallback(async (): Promise<{
    projectId?: string
    verification?: {
      verified: boolean
      message?: string
    }
  } | undefined> => {
    if (!state.currentRecommendation || !state.conversationId) return

    dispatch({ type: "APPROVE_START" })

    const response = await fetch("/api/planning/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: state.session?.backendConversationId,  // Backend session ID
        supabaseConversationId: state.conversationId,          // Local DB record ID
        projectId: options.projectId,
        sprintId: options.sprintId,
        recommendation: state.currentRecommendation,
      }),
    })

    const result = await response.json()
    options.onApprove?.(state.currentRecommendation)

    dispatch({ type: "APPROVE_COMPLETE" })

    return {
      projectId: result.projectId || options.projectId,
      verification: result.verification ? {
        verified: result.verification.verified,
        message: result.verification.verified
          ? undefined
          : `${result.verification.successful}/${result.verification.total} entities synced. Some may still be syncing.`
      } : undefined
    }
  }, [state.currentRecommendation, state.conversationId, state.session, options])

  const reset = useCallback(async () => {
    // TODO: call backend API to mark conversation as abandoned if needed
    dispatch({ type: "RESET" })
  }, [])

  return {
    messages: state.messages,
    isStreaming: state.isStreaming,
    isLoading: state.isLoading,
    currentRecommendation: state.currentRecommendation,
    currentPhase: state.currentPhase,
    session: state.session,
    isReadyForApproval: state.isReadyForApproval,
    sendMessage,
    approveRecommendation,
    reset,
    conversationId: state.conversationId,
  }
}
