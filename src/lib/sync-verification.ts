/**
 * Sync Verification Utilities
 *
 * Verifies that entities created via Modal API have synced to Supabase.
 * The sync path is: Modal API → JSONL → Sync Worker → Supabase
 * This async process can have latency, so we poll to verify.
 */

import { createClient } from '@supabase/supabase-js'

export const SYNC_VERIFICATION = {
  INITIAL_DELAY_MS: 500,      // Wait before first check
  POLL_INTERVAL_MS: 1000,     // Time between checks
  MAX_ATTEMPTS: 10,           // Max verification attempts
  MAX_WAIT_MS: 10000,         // Total max wait time
} as const

export interface VerificationResult {
  exists: boolean
  attempts: number
  entityType: string
  entityId: string
  error?: string
}

export interface VerificationSummary {
  verified: boolean
  total: number
  successful: number
  failures: VerificationResult[]
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Verify a single entity exists in Supabase by its source_id (Modal ID)
 */
export async function verifySyncToSupabase(
  entityType: 'projects' | 'sprints' | 'tasks',
  modalEntityId: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<VerificationResult> {
  const supabase = createClient(supabaseUrl, supabaseKey)
  let attempts = 0

  // Initial delay to allow sync worker to process
  await sleep(SYNC_VERIFICATION.INITIAL_DELAY_MS)

  while (attempts < SYNC_VERIFICATION.MAX_ATTEMPTS) {
    attempts++

    try {
      const { data, error } = await supabase
        .from(entityType)
        .select('id')
        .eq('source_id', modalEntityId)
        .maybeSingle()

      if (error) {
        console.error(`Sync verification error for ${entityType}/${modalEntityId}:`, error)
      }

      if (data) {
        return {
          exists: true,
          attempts,
          entityType,
          entityId: modalEntityId
        }
      }
    } catch (err) {
      console.error(`Sync verification exception for ${entityType}/${modalEntityId}:`, err)
    }

    // Wait before next attempt
    await sleep(SYNC_VERIFICATION.POLL_INTERVAL_MS)
  }

  return {
    exists: false,
    attempts,
    entityType,
    entityId: modalEntityId,
    error: `Entity not found after ${attempts} attempts`
  }
}

/**
 * Verify multiple entities and return a summary
 */
export async function verifyMultipleEntities(
  entities: Array<{ type: 'projects' | 'sprints' | 'tasks', id: string }>,
  supabaseUrl: string,
  supabaseKey: string
): Promise<VerificationSummary> {
  const results = await Promise.all(
    entities.map(e => verifySyncToSupabase(e.type, e.id, supabaseUrl, supabaseKey))
  )

  const failures = results.filter(r => !r.exists)

  return {
    verified: failures.length === 0,
    total: entities.length,
    successful: entities.length - failures.length,
    failures
  }
}
