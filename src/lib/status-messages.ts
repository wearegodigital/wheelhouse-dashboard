/**
 * Status message pools for planning chat phases.
 * Provides variety in status messages to make the UI feel more dynamic.
 */

export const STATUS_MESSAGES: Record<string, string[]> = {
  starting: [
    "Getting ready...",
    "Warming up...",
    "Preparing...",
    "Initializing..."
  ],
  continuing: [
    "Continuing...",
    "Still here...",
    "Picking up where we left off...",
    "Back to it..."
  ],
  reconnecting: [
    "Reconnecting...",
    "Getting back in sync...",
    "Resuming session...",
    "Restoring context..."
  ],
  analyzing: [
    "Looking at your codebase...",
    "Understanding the structure...",
    "Reviewing patterns...",
    "Scanning files..."
  ],
  thinking: [
    "Considering approaches...",
    "Formulating plan...",
    "Working on it...",
    "Almost there..."
  ],
  cloning: [
    "Fetching repository...",
    "Cloning codebase...",
    "Downloading files...",
    "Getting source code..."
  ],
  complete: [
    "All done!",
    "Ready!",
    "Here's what I found"
  ]
}

/**
 * Get a varied status message for a phase.
 * Uses timestamp to deterministically select a message for variety.
 *
 * @param phase - The phase name (starting, analyzing, thinking, etc.)
 * @param timestamp - Optional timestamp for message selection variety
 * @returns A status message string
 */
export function getStatusMessage(phase: string, timestamp?: number): string {
  const messages = STATUS_MESSAGES[phase]
  if (!messages || messages.length === 0) {
    // Fallback: capitalize first letter of phase
    return phase.charAt(0).toUpperCase() + phase.slice(1) + "..."
  }
  const index = timestamp ? Math.floor(timestamp / 1000) % messages.length : 0
  return messages[index]
}

/**
 * Check if a message is a generic phase name that should be enhanced.
 * Modal sometimes sends just the phase name as the message.
 */
export function shouldEnhanceMessage(phase: string, message: string): boolean {
  if (!message || message.trim() === "") return true
  // If message is just the phase name (case-insensitive), enhance it
  return message.toLowerCase() === phase.toLowerCase()
}
