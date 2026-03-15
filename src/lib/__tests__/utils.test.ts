import { describe, it, expect } from 'vitest'
import { cn, sanitizeSearch, truncate, parseRepoUrl, formatRelativeTime } from '../utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  it('deduplicates tailwind classes', () => {
    // tailwind-merge should resolve conflicting utilities
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('handles empty input', () => {
    expect(cn()).toBe('')
  })
})

describe('sanitizeSearch', () => {
  it('strips PostgREST operator characters', () => {
    expect(sanitizeSearch('test(value)')).toBe('testvalue')
    expect(sanitizeSearch('col[0]')).toBe('col0')
    expect(sanitizeSearch('a{b}')).toBe('ab')
  })

  it('strips commas and dots', () => {
    expect(sanitizeSearch('a,b.c')).toBe('abc')
  })

  it('trims whitespace', () => {
    expect(sanitizeSearch('  hello  ')).toBe('hello')
  })

  it('handles empty string', () => {
    expect(sanitizeSearch('')).toBe('')
  })

  it('passes through safe strings unchanged', () => {
    expect(sanitizeSearch('my search query')).toBe('my search query')
  })
})

describe('truncate', () => {
  it('truncates long strings with ellipsis', () => {
    expect(truncate('Hello World!', 8)).toBe('Hello...')
  })

  it('returns short strings unchanged', () => {
    expect(truncate('Hi', 10)).toBe('Hi')
  })

  it('returns exact-length strings unchanged', () => {
    expect(truncate('exact', 5)).toBe('exact')
  })
})

describe('parseRepoUrl', () => {
  it('parses HTTPS GitHub URLs', () => {
    expect(parseRepoUrl('https://github.com/octocat/hello-world')).toEqual({
      owner: 'octocat',
      repo: 'hello-world',
    })
  })

  it('parses SSH GitHub URLs', () => {
    expect(parseRepoUrl('git@github.com:octocat/hello-world.git')).toEqual({
      owner: 'octocat',
      repo: 'hello-world',
    })
  })

  it('returns null for non-GitHub URLs', () => {
    expect(parseRepoUrl('https://gitlab.com/user/repo')).toBeNull()
  })

  it('returns null for invalid URLs', () => {
    expect(parseRepoUrl('not-a-url')).toBeNull()
  })
})

describe('formatRelativeTime', () => {
  it('returns "just now" for very recent times', () => {
    const now = new Date()
    expect(formatRelativeTime(now)).toBe('just now')
  })

  it('returns minutes ago for recent times', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
    expect(formatRelativeTime(fiveMinAgo)).toBe('5m ago')
  })

  it('returns hours ago for same-day times', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
    expect(formatRelativeTime(threeHoursAgo)).toBe('3h ago')
  })

  it('returns days ago for recent past', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(twoDaysAgo)).toBe('2d ago')
  })
})
