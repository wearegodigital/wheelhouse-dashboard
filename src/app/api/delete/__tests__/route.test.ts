import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase server client
const mockGetUser = vi.fn()
const mockUpdate = vi.fn().mockReturnThis()
const mockEq = vi.fn().mockReturnThis()
const mockIn = vi.fn().mockReturnThis()
const mockSelect = vi.fn().mockReturnThis()
const mockDelete = vi.fn().mockReturnThis()

const mockSupabase = {
  auth: {
    getUser: (...args: unknown[]) => mockGetUser(...args),
  },
  from: vi.fn(() => ({
    select: mockSelect,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    in: mockIn,
  })),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

// Mock fetch for Modal API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

const { DELETE } = await import('../route')

function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL('http://localhost:3000/api/delete')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return new NextRequest(url.toString(), { method: 'DELETE' })
}

describe('DELETE /api/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    })
    process.env.MODAL_API_URL = 'https://modal.example.com'
  })

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } })

    const res = await DELETE(makeRequest({ type: 'projects', id: '123' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when type or id is missing', async () => {
    const res = await DELETE(makeRequest({ type: 'projects' }))
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.message).toBe('Missing type or id parameter')
  })

  it('returns 400 for invalid entity type', async () => {
    const res = await DELETE(makeRequest({ type: 'widgets', id: '123' }))
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.message).toBe('Invalid entity type')
  })

  it('proxies delete to Modal and returns success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, message: 'Deleted' }),
    })

    const res = await DELETE(makeRequest({ type: 'tasks', id: 'task-uuid' }))
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('falls back to Supabase when Modal returns 404', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ error: 'Not found' }),
    })

    // Mock Supabase soft delete chain
    mockEq.mockResolvedValue({ error: null })

    const res = await DELETE(makeRequest({ type: 'tasks', id: 'task-uuid' }))
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.deleted_at).toBeDefined()
  })

  it('falls back to Supabase when Modal fetch throws network error', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'))

    mockEq.mockResolvedValue({ error: null })

    const res = await DELETE(makeRequest({ type: 'projects', id: 'proj-uuid' }))
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
  })
})
