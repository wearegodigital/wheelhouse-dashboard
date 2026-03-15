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

const { POST } = await import('../route')

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/create', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/create', () => {
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

    const res = await POST(makeRequest({ type: 'projects', name: 'Test' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid entity type', async () => {
    const res = await POST(makeRequest({ type: 'widgets', name: 'Test' }))
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.message).toBe('Invalid or missing entity type')
  })

  it('returns 400 for missing entity type', async () => {
    const res = await POST(makeRequest({ name: 'Test' }))
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.message).toBe('Invalid or missing entity type')
  })

  it('returns 400 when sprint is missing project_id', async () => {
    const res = await POST(makeRequest({ type: 'sprints', name: 'Sprint 1' }))
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.message).toBe('Sprint requires project_id and name')
  })

  it('returns 400 when task is missing title or repo_url', async () => {
    const res = await POST(makeRequest({ type: 'tasks', title: 'Do thing' }))
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.message).toBe('Task requires title and repo_url')
  })

  it('creates a project via Modal API and returns id', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        project_id: 'proj-uuid-123',
        message: 'Created',
      }),
    })

    const res = await POST(makeRequest({
      type: 'projects',
      name: 'My Project',
      description: 'A test project',
    }))
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.id).toBe('proj-uuid-123')

    // Verify Modal was called with correct endpoint and payload
    expect(mockFetch).toHaveBeenCalledWith(
      'https://modal.example.com/projects',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'My Project',
          description: 'A test project',
          repo_url: '',
        }),
      })
    )
  })

  it('handles Modal error response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ success: false, message: 'Validation error' }),
    })

    const res = await POST(makeRequest({ type: 'projects', name: 'Bad Project' }))
    expect(res.status).toBe(422)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.message).toBe('Create request failed')
  })

  it('returns 500 when MODAL_API_URL is not configured', async () => {
    process.env.MODAL_API_URL = ''

    const res = await POST(makeRequest({ type: 'projects', name: 'Test' }))
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json.success).toBe(false)
  })
})
