/**
 * Entity Verification Utilities
 *
 * Verifies that entities exist in Supabase after creation.
 * With Supabase-primary architecture, Modal writes directly to Supabase,
 * so entities exist immediately without sync delay.
 */

import { createClient } from '@supabase/supabase-js'

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

/**
 * Verify a single entity exists in Supabase by its ID
 * With Supabase-primary, this is a simple existence check with no polling needed.
 */
export async function verifySyncToSupabase(
  entityType: 'projects' | 'sprints' | 'tasks',
  entityId: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<VerificationResult> {
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { data, error } = await supabase
      .from(entityType)
      .select('id')
      .eq('id', entityId)
      .maybeSingle()

    if (error) {
      console.error(`Entity verification error for ${entityType}/${entityId}:`, error)
      return {
        exists: false,
        attempts: 1,
        entityType,
        entityId,
        error: error.message
      }
    }

    if (data) {
      return {
        exists: true,
        attempts: 1,
        entityType,
        entityId
      }
    }

    return {
      exists: false,
      attempts: 1,
      entityType,
      entityId,
      error: 'Entity not found'
    }
  } catch (err) {
    console.error(`Entity verification exception for ${entityType}/${entityId}:`, err)
    return {
      exists: false,
      attempts: 1,
      entityType,
      entityId,
      error: err instanceof Error ? err.message : 'Unknown error'
    }
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
