/**
 * Planning Session Manager
 *
 * Tracks session state client-side to provide better UX feedback
 * about whether the orchestrator is "warm" (recently active) or "cold" (needs startup).
 */

export const SESSION_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes

export interface PlanningSession {
  sessionId: string
  conversationId: string | null        // Supabase ID
  backendConversationId: string | null // Modal session ID
  lastActivityAt: number
  isActive: boolean
}

/**
 * Create a new session state object
 */
export function createSession(conversationId: string | null = null): PlanningSession {
  return {
    sessionId: crypto.randomUUID(),
    conversationId,
    backendConversationId: null,  // Will be set from first SSE event
    lastActivityAt: Date.now(),
    isActive: true,
  }
}

/**
 * Check if session is still warm (within timeout window)
 */
export function isSessionWarm(session: PlanningSession | null): boolean {
  if (!session) return false
  return Date.now() - session.lastActivityAt < SESSION_TIMEOUT_MS
}

/**
 * Check if session has expired
 */
export function isSessionExpired(session: PlanningSession | null): boolean {
  if (!session) return true
  return Date.now() - session.lastActivityAt >= SESSION_TIMEOUT_MS
}

/**
 * Update session activity timestamp
 */
export function touchSession(session: PlanningSession): PlanningSession {
  return {
    ...session,
    lastActivityAt: Date.now(),
  }
}

/**
 * Set the backend conversation ID from SSE response
 */
export function setBackendConversationId(
  session: PlanningSession,
  backendId: string
): PlanningSession {
  return {
    ...session,
    backendConversationId: backendId,
    lastActivityAt: Date.now(),
  }
}

/**
 * Get the appropriate status phase based on session state
 * Returns a modified phase name for better UX feedback
 */
export function getSessionAwarePhase(
  originalPhase: string,
  session: PlanningSession | null
): string {
  // Only modify "starting" phase based on session state
  if (originalPhase !== 'starting') return originalPhase

  if (isSessionWarm(session)) {
    return 'continuing' // Will show "Continuing..." messages
  }

  if (session && isSessionExpired(session)) {
    return 'reconnecting' // Will show "Reconnecting..." messages
  }

  return originalPhase // New session, show normal starting messages
}
