"use client"

import { useReducer, useCallback } from "react"

// --- Types ---

export interface GuidedQuestion {
  id: string
  prompt: string
  type: "single_choice" | "multi_choice" | "text" | "scale"
  options: Array<{ value: string; label: string; description?: string }>
  recommendation: string | null
  required: boolean
}

export interface GuidedStep {
  step_index: number
  step_name: string
  title: string
  description: string
  questions: GuidedQuestion[]
  ready: boolean
}

export interface GenerationPhase {
  phase: string
  message: string
  icon: string
  elapsed: number
}

export interface GuidedPlanningState {
  status: "idle" | "loading" | "step_ready" | "generating" | "plan_ready" | "error"
  sessionToken: string | null
  conversationId: string | null
  planId: string | null
  currentStep: GuidedStep | null
  totalSteps: number
  accumulatedAnswers: Record<string, unknown>
  plan: unknown | null  // DecompositionRecommendation when plan is generated
  error: string | null
  currentPhase: GenerationPhase | null
}

type GuidedAction =
  | { type: "START_LOADING" }
  | { type: "STEP_RECEIVED"; step: GuidedStep; sessionToken: string; totalSteps: number }
  | { type: "STEPS_COMPLETE"; sessionToken: string }
  | { type: "ANSWER"; questionId: string; value: unknown }
  | { type: "GENERATING" }
  | { type: "PLAN_READY"; plan: unknown }
  | { type: "CONVERSATION_ID_RECEIVED"; payload: string }
  | { type: "PLAN_ID_RECEIVED"; planId: string }
  | { type: "ERROR"; error: string }
  | { type: "RESET" }
  | { type: "PHASE_UPDATE"; phase: string; message: string; icon: string; elapsed: number }

// --- Reducer ---

const initialState: GuidedPlanningState = {
  status: "idle",
  sessionToken: null,
  conversationId: null,
  planId: null,
  currentStep: null,
  totalSteps: 4,
  accumulatedAnswers: {},
  plan: null,
  error: null,
  currentPhase: null,
}

function reducer(state: GuidedPlanningState, action: GuidedAction): GuidedPlanningState {
  switch (action.type) {
    case "START_LOADING":
      return { ...state, status: "loading", error: null }
    case "STEP_RECEIVED":
      return {
        ...state,
        status: "step_ready",
        currentStep: action.step,
        sessionToken: action.sessionToken,
        totalSteps: action.totalSteps,
      }
    case "STEPS_COMPLETE":
      return { ...state, status: "step_ready", sessionToken: action.sessionToken, currentStep: null }
    case "ANSWER":
      return {
        ...state,
        accumulatedAnswers: { ...state.accumulatedAnswers, [action.questionId]: action.value },
      }
    case "GENERATING":
      return { ...state, status: "generating" }
    case "PLAN_READY":
      return { ...state, status: "plan_ready", plan: action.plan }
    case "CONVERSATION_ID_RECEIVED":
      return { ...state, conversationId: action.payload }
    case "PLAN_ID_RECEIVED":
      return { ...state, planId: action.planId }
    case "ERROR":
      return { ...state, status: "error", error: action.error }
    case "RESET":
      return initialState
    case "PHASE_UPDATE":
      return {
        ...state,
        currentPhase: {
          phase: action.phase,
          message: action.message,
          icon: action.icon,
          elapsed: action.elapsed,
        },
      }
    default:
      return state
  }
}

// --- Hook ---

interface UseGuidedPlanningOptions {
  notionTaskId?: string
  repoUrl?: string
  goal?: string
  context?: Record<string, unknown>
}

export function useGuidedPlanning(options: UseGuidedPlanningOptions = {}) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const startPlanning = useCallback(async () => {
    dispatch({ type: "START_LOADING" })
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const resp = await fetch("/api/planning/guided", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          step_index: 0,
          notion_task_id: options.notionTaskId,
          goal: options.goal || "",
          context: options.context || {},
          accumulated_answers: {},
        }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.detail || data.error || "Failed to start planning")

      if (data.complete) {
        dispatch({ type: "STEPS_COMPLETE", sessionToken: data.session_token })
      } else {
        dispatch({
          type: "STEP_RECEIVED",
          step: data.step,
          sessionToken: data.session_token,
          totalSteps: data.total_steps,
        })
      }
    } catch (e) {
      dispatch({ type: "ERROR", error: (e as Error).message })
    }
  }, [options.notionTaskId, options.goal, options.context])

  const answerQuestion = useCallback((questionId: string, value: unknown) => {
    dispatch({ type: "ANSWER", questionId, value })
  }, [])

  const nextStep = useCallback(async () => {
    if (!state.currentStep || !state.sessionToken) return
    dispatch({ type: "START_LOADING" })
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const nextIndex = state.currentStep.step_index + 1
      const resp = await fetch("/api/planning/guided", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          step_index: nextIndex,
          session_token: state.sessionToken,
          accumulated_answers: state.accumulatedAnswers,
        }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.detail || "Failed to advance step")

      if (data.complete) {
        dispatch({ type: "STEPS_COMPLETE", sessionToken: data.session_token })
      } else {
        dispatch({
          type: "STEP_RECEIVED",
          step: data.step,
          sessionToken: data.session_token,
          totalSteps: data.total_steps,
        })
      }
    } catch (e) {
      dispatch({ type: "ERROR", error: (e as Error).message })
    }
  }, [state.currentStep, state.sessionToken, state.accumulatedAnswers])

  const goBack = useCallback(async () => {
    if (!state.currentStep || state.currentStep.step_index === 0 || !state.sessionToken) return
    dispatch({ type: "START_LOADING" })
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const prevIndex = state.currentStep.step_index - 1
      // Strip answers for steps > target (back navigation contract)
      const trimmedAnswers = { ...state.accumulatedAnswers }
      // We don't know which keys belong to which step, so we keep all and let the backend regenerate

      const resp = await fetch("/api/planning/guided", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          step_index: prevIndex,
          session_token: state.sessionToken,
          accumulated_answers: trimmedAnswers,
        }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.detail || "Failed to go back")

      dispatch({
        type: "STEP_RECEIVED",
        step: data.step,
        sessionToken: data.session_token,
        totalSteps: data.total_steps,
      })
    } catch (e) {
      dispatch({ type: "ERROR", error: (e as Error).message })
    }
  }, [state.currentStep, state.sessionToken, state.accumulatedAnswers])

  const generatePlan = useCallback(async () => {
    if (!state.sessionToken) return
    dispatch({ type: "GENERATING" })

    const controller = new AbortController()
    // Overall 5-minute timeout for the entire generation
    const overallTimeout = setTimeout(() => {
      controller.abort()
      dispatch({ type: "ERROR", error: "Plan generation timed out after 5 minutes. Please try again." })
    }, 5 * 60 * 1000)

    let planId: string | null = null
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      // Create plan record directly in Supabase (bypasses Modal for instant persistence)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: planRecord, error: planError } = await (supabase as any)
          .from("plans")
          .insert({
            status: "generating",
            repo_url: options.repoUrl || options.context?.repo_url || "",
            notion_task_id: options.notionTaskId || null,
          })
          .select()
          .single()

        if (planError) {
          console.error("[Planning] Failed to create plan record:", planError)
        } else {
          planId = planRecord.id
          dispatch({ type: "PLAN_ID_RECEIVED", planId: planRecord.id })
        }
      } catch (err) {
        console.error("[Planning] Plan record creation error:", err)
      }

      const resp = await fetch("/api/planning/guided/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ session_token: state.sessionToken, plan_id: planId }),
        signal: controller.signal,
      })

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ detail: "Generation failed" }))
        throw new Error(err.detail || err.error || "Plan generation failed")
      }

      const contentType = resp.headers.get("content-type") || ""
      if (!contentType.includes("text/event-stream")) {
        // Not SSE — parse as JSON directly
        const data = await resp.json().catch(() => null)
        if (data?.conversation_id) {
          dispatch({ type: "CONVERSATION_ID_RECEIVED", payload: data.conversation_id })
        }
        if (data?.plan_id) {
          dispatch({ type: "PLAN_ID_RECEIVED", planId: data.plan_id })
        }
        if (data?.recommendations) {
          dispatch({ type: "PLAN_READY", plan: data.recommendations })
        } else {
          dispatch({ type: "ERROR", error: data?.error || data?.detail || "No plan generated" })
        }
        return
      }

      // Parse SSE stream with per-chunk timeout
      const reader = resp.body?.getReader()
      if (!reader) throw new Error("No response stream")

      const decoder = new TextDecoder()
      let plan: unknown = null
      let buffer = ""
      const CHUNK_TIMEOUT_MS = 60_000 // 60 seconds between chunks (generation can be slow)

      const readWithTimeout = async (): Promise<ReadableStreamReadResult<Uint8Array>> => {
        return Promise.race([
          reader.read(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Stream stalled — no data received for 60 seconds")), CHUNK_TIMEOUT_MS)
          ),
        ])
      }

      try {
        while (true) {
          const { done, value } = await readWithTimeout()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Process complete SSE messages
          const sseMessages = buffer.split("\n\n")
          buffer = sseMessages.pop() || ""

          for (const sseMessage of sseMessages) {
            for (const line of sseMessage.split("\n")) {
              if (!line.startsWith("data: ")) continue
              try {
                const data = JSON.parse(line.slice(6))
                if (data.conversation_id && !state.conversationId) {
                  dispatch({ type: "CONVERSATION_ID_RECEIVED", payload: data.conversation_id })
                }
                if (data.plan_id && !state.planId) {
                  dispatch({ type: "PLAN_ID_RECEIVED", planId: data.plan_id })
                }
                // Track generation phase progress from SSE events
                if (
                  data.phase &&
                  data.type !== "recommendations" &&
                  data.done !== true
                ) {
                  dispatch({
                    type: "PHASE_UPDATE",
                    phase: data.phase,
                    message: data.message ?? "",
                    icon: data.icon ?? "",
                    elapsed: typeof data.elapsed === "number" ? data.elapsed : 0,
                  })
                }
                if (data.type === "recommendations" && data.recommendations) {
                  plan = data.recommendations
                } else if (data.recommendations) {
                  plan = data.recommendations
                }
                // Handle done event — stream finished
                if (data.done === true) {
                  break
                }
                // Handle actions_taken (fallback — backend builds recommendation from these)
                if (data.actions_taken && Array.isArray(data.actions_taken)) {
                  for (const action of data.actions_taken) {
                    if (action.type === "file_created" && action.name?.includes("APPROVED_PLAN")) {
                      try {
                        const planContent = JSON.parse(action.content || "{}")
                        if (planContent.sprints || planContent.project) {
                          plan = planContent
                        }
                      } catch {
                        // Not valid JSON, skip
                      }
                    }
                  }
                }
                // Handle explicit error events from the backend
                if (data.type === "error") {
                  throw new Error(data.error || data.detail || "Backend error during generation")
                }
              } catch (parseErr) {
                // Re-throw if it's our explicit error, skip if it's just bad JSON
                if (parseErr instanceof Error && parseErr.message !== "Unexpected end of JSON input") {
                  if (!parseErr.message.includes("JSON")) throw parseErr
                }
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

      // Process any remaining buffered content
      if (buffer.trim()) {
        for (const line of buffer.split("\n")) {
          if (!line.startsWith("data: ")) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.conversation_id && !state.conversationId) {
              dispatch({ type: "CONVERSATION_ID_RECEIVED", payload: data.conversation_id })
            }
            if (data.plan_id && !state.planId) {
              dispatch({ type: "PLAN_ID_RECEIVED", planId: data.plan_id })
            }
            if (data.type === "recommendations" && data.recommendations) {
              plan = data.recommendations
            } else if (data.recommendations) {
              plan = data.recommendations
            }
            // Handle done event
            if (data.done === true) {
              break
            }
            // Handle actions_taken (fallback — backend builds recommendation from these)
            if (data.actions_taken && Array.isArray(data.actions_taken)) {
              for (const action of data.actions_taken) {
                if (action.type === "file_created" && action.name?.includes("APPROVED_PLAN")) {
                  try {
                    const planContent = JSON.parse(action.content || "{}")
                    if (planContent.sprints || planContent.project) {
                      plan = planContent
                    }
                  } catch {
                    // Not valid JSON, skip
                  }
                }
              }
            }
          } catch {
            // Skip non-JSON lines
          }
        }
      }

      if (plan) {
        // Persist recommendation + status to Supabase so Planning Hub can see it
        if (planId) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: updateError } = await (supabase as any)
              .from("plans")
              .update({
                status: "pending_review",
                recommendation: plan,
                updated_at: new Date().toISOString(),
              })
              .eq("id", planId)
            if (updateError) {
              console.error("[Planning] Failed to update plan record:", updateError)
            }
          } catch (err) {
            console.error("[Planning] Plan record update error:", err)
          }
        }
        dispatch({ type: "PLAN_READY", plan })
      } else {
        dispatch({ type: "ERROR", error: "Plan generation completed but no plan was returned. The backend may have encountered an error. Please try again." })
      }
    } catch (e) {
      if (controller.signal.aborted) {
        // Already dispatched timeout error above, or component unmounted
        return
      }
      // Mark plan as failed in Supabase so it doesn't stay "generating" forever
      if (planId) {
        try {
          const { createClient: cc } = await import("@/lib/supabase/client")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (cc() as any)
            .from("plans")
            .update({ status: "draft", updated_at: new Date().toISOString() })
            .eq("id", planId)
        } catch {
          // Best-effort cleanup
        }
      }
      dispatch({ type: "ERROR", error: (e as Error).message })
    } finally {
      clearTimeout(overallTimeout)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sessionToken, state.conversationId, state.planId, options.repoUrl, options.notionTaskId])

  const reset = useCallback(() => {
    dispatch({ type: "RESET" })
  }, [])

  return {
    ...state,
    startPlanning,
    answerQuestion,
    nextStep,
    goBack,
    generatePlan,
    reset,
  }
}
