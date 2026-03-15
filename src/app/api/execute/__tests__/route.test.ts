import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase server client
const mockGetUser = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
  }),
}))

// Mock fetch for Modal API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

// Import after mocks
const { POST } = await import('../route')

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/execute', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/execute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    })
    // Set MODAL_API_URL for tests
    process.env.MODAL_API_URL = 'https://modal.example.com'
  })

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } })

    const res = await POST(makeRequest({ level: 'task', id: '123', action: 'run' }))
    expect(res.status).toBe(401)

    const json = await res.json()
    expect(json.error).toBe('Authentication required')
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await POST(makeRequest({ level: 'task' }))
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.error).toBe('Missing required fields')
  })

  it('returns 400 for invalid level', async () => {
    const res = await POST(makeRequest({ level: 'invalid', id: '123', action: 'run' }))
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.error).toBe('Invalid level')
  })

  it('returns 400 for invalid action', async () => {
    const res = await POST(makeRequest({ level: 'task', id: '123', action: 'explode' }))
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.error).toBe('Invalid action')
  })

  it('returns 500 when MODAL_API_URL is not configured', async () => {
    delete process.env.MODAL_API_URL

    const res = await POST(makeRequest({ level: 'task', id: '123', action: 'run' }))
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json.error).toBe('Server configuration error')
  })

  it('proxies valid request to Modal and returns success', async () => {
    const modalResponse = {
      success: true,
      execution_id: 'exec-abc',
      status: 'running',
    }
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(modalResponse),
    })

    const res = await POST(makeRequest({ level: 'sprint', id: 'sprint-1', action: 'run' }))
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.execution_id).toBe('exec-abc')

    // Verify fetch was called with correct URL and body
    expect(mockFetch).toHaveBeenCalledWith(
      'https://modal.example.com/execute',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ level: 'sprint', id: 'sprint-1', action: 'run' }),
      })
    )
  })

  it('returns sanitized error when Modal returns non-OK response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
      text: () => Promise.resolve(JSON.stringify({ detail: 'Gateway timeout' })),
    })

    const res = await POST(makeRequest({ level: 'task', id: '123', action: 'run' }))
    expect(res.status).toBe(502)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error).toBe('Execution request failed')
    // Should NOT leak internal error details
    expect(json.detail).toBeUndefined()
  })

  it('passes optional fields (pattern, distribution, workers) to Modal', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    })

    await POST(makeRequest({
      level: 'sprint',
      id: 'sprint-1',
      action: 'run',
      pattern: 'sequential',
      distribution: 'swarm',
      workers: 3,
    }))

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(callBody.pattern).toBe('sequential')
    expect(callBody.distribution).toBe('swarm')
    expect(callBody.workers).toBe(3)
  })
})
