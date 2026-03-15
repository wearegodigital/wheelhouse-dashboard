import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock data
const mockProjects = [
  {
    id: 'proj-1',
    name: 'Project Alpha',
    description: 'First project',
    status: 'draft',
    created_at: '2025-01-01T00:00:00Z',
    sprint_count: 2,
    task_count: 5,
  },
  {
    id: 'proj-2',
    name: 'Project Beta',
    description: 'Second project',
    status: 'running',
    created_at: '2025-01-02T00:00:00Z',
    sprint_count: 1,
    task_count: 3,
  },
]

const mockSingleProject = {
  id: 'proj-1',
  name: 'Project Alpha',
  description: 'First project',
  status: 'draft',
  deleted_at: null,
  created_at: '2025-01-01T00:00:00Z',
}

// Build a chainable mock for Supabase query builder.
// The chain itself is thenable so `await chain` resolves with { data, error }.
// All filter methods (select, eq, is, or, order) return `self` so they remain
// chainable regardless of call order (matches Supabase's PostgrestFilterBuilder).
function createChainMock(resolvedData: unknown, resolvedError: unknown = null) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  const self = () => chain

  chain.select = vi.fn().mockImplementation(self)
  chain.eq = vi.fn().mockImplementation(self)
  chain.is = vi.fn().mockImplementation(self)
  chain.or = vi.fn().mockImplementation(self)
  chain.order = vi.fn().mockImplementation(self)
  chain.single = vi.fn().mockImplementation(() =>
    Promise.resolve({ data: resolvedData, error: resolvedError })
  )
  // Make the chain itself thenable so `await chain` resolves correctly.
  chain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
    resolve({ data: resolvedData, error: resolvedError })
    return Promise.resolve({ data: resolvedData, error: resolvedError })
  })

  return chain
}

const mockProjectListChain = createChainMock(mockProjects)
const mockSingleProjectChain = createChainMock(mockSingleProject)

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'project_summary') return mockProjectListChain
      if (table === 'projects') return mockSingleProjectChain
      return createChainMock(null)
    }),
  })),
}))

// Mock the API functions used by mutation hooks
vi.mock('@/lib/api/wheelhouse', () => ({
  deleteProject: vi.fn().mockResolvedValue({ success: true }),
  createProject: vi.fn().mockResolvedValue({ success: true, id: 'new-proj' }),
}))

// Mock sanitizeSearch
vi.mock('@/lib/utils', async () => {
  const actual = await vi.importActual<typeof import('@/lib/utils')>('@/lib/utils')
  return actual
})

const { useProjects, useProject } = await import('@/hooks/useProjects')

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns project list', async () => {
    const { result } = renderHook(() => useProjects(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockProjects)
    expect(result.current.data).toHaveLength(2)
  })

  it('passes status filter to query', async () => {
    const { result } = renderHook(
      () => useProjects({ status: 'running' as never }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockProjectListChain.eq).toHaveBeenCalledWith('status', 'running')
  })

  it('passes search filter to query', async () => {
    const { result } = renderHook(
      () => useProjects({ search: 'alpha' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockProjectListChain.or).toHaveBeenCalledWith(
      'name.ilike.%alpha%,description.ilike.%alpha%'
    )
  })
})

describe('useProject', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns single project by id', async () => {
    const { result } = renderHook(
      () => useProject('proj-1'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockSingleProject)
  })

  it('filters out deleted records', async () => {
    const { result } = renderHook(
      () => useProject('proj-1'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Verify .is('deleted_at', null) was called
    expect(mockSingleProjectChain.is).toHaveBeenCalledWith('deleted_at', null)
  })

  it('does not fetch when id is empty', async () => {
    const { result } = renderHook(
      () => useProject(''),
      { wrapper: createWrapper() }
    )

    // Should remain in initial state (not fetching)
    expect(result.current.isFetching).toBe(false)
  })
})
