import { describe, it, expect } from 'vitest'
import {
  getStatusBadgeVariant,
  pluralize,
  getPatternBadgeText,
  getPatternBadgeVariant,
  getDistributionBadgeText,
  getDistributionBadgeVariant,
  getPatternIcon,
} from '../status'

describe('getStatusBadgeVariant', () => {
  it('returns "success" for completed', () => {
    expect(getStatusBadgeVariant('completed')).toBe('success')
  })

  it('returns "default" for running statuses', () => {
    expect(getStatusBadgeVariant('running')).toBe('default')
    expect(getStatusBadgeVariant('in_progress')).toBe('default')
    expect(getStatusBadgeVariant('validating')).toBe('default')
    expect(getStatusBadgeVariant('assigned')).toBe('default')
  })

  it('returns "destructive" for failure statuses', () => {
    expect(getStatusBadgeVariant('failed')).toBe('destructive')
    expect(getStatusBadgeVariant('cancelled')).toBe('destructive')
  })

  it('returns "warning" for ready and checking', () => {
    expect(getStatusBadgeVariant('ready')).toBe('warning')
    expect(getStatusBadgeVariant('checking')).toBe('warning')
  })

  it('returns "secondary" for inactive statuses', () => {
    expect(getStatusBadgeVariant('draft')).toBe('secondary')
    expect(getStatusBadgeVariant('planning')).toBe('secondary')
    expect(getStatusBadgeVariant('pending')).toBe('secondary')
    expect(getStatusBadgeVariant('queued')).toBe('secondary')
    expect(getStatusBadgeVariant('paused')).toBe('secondary')
    expect(getStatusBadgeVariant('spawned')).toBe('secondary')
  })

  it('returns "outline" for unknown statuses', () => {
    expect(getStatusBadgeVariant('something_else')).toBe('outline')
    expect(getStatusBadgeVariant('')).toBe('outline')
  })
})

describe('pluralize', () => {
  it('returns singular for count of 1', () => {
    expect(pluralize(1, 'sprint')).toBe('sprint')
  })

  it('returns plural for count of 0', () => {
    expect(pluralize(0, 'task')).toBe('tasks')
  })

  it('returns plural for count > 1', () => {
    expect(pluralize(5, 'sprint')).toBe('sprints')
  })

  it('uses custom plural form', () => {
    expect(pluralize(2, 'index', 'indices')).toBe('indices')
  })
})

describe('getPatternBadgeText', () => {
  it('returns "Standard" for null', () => {
    expect(getPatternBadgeText(null)).toBe('Standard')
  })

  it('returns correct text for each pattern', () => {
    expect(getPatternBadgeText('sequential')).toBe('Sequential')
    expect(getPatternBadgeText('tournament')).toBe('Tournament')
    expect(getPatternBadgeText('cascade')).toBe('Cascade')
  })
})

describe('getPatternBadgeVariant', () => {
  it('returns "outline" for null', () => {
    expect(getPatternBadgeVariant(null)).toBe('outline')
  })

  it('returns correct variant for each pattern', () => {
    expect(getPatternBadgeVariant('sequential')).toBe('secondary')
    expect(getPatternBadgeVariant('tournament')).toBe('default')
    expect(getPatternBadgeVariant('cascade')).toBe('warning')
  })
})

describe('getDistributionBadgeText', () => {
  it('returns correct text for each mode', () => {
    expect(getDistributionBadgeText('single')).toBe('Single Agent')
    expect(getDistributionBadgeText('swarm')).toBe('Swarm')
  })
})

describe('getDistributionBadgeVariant', () => {
  it('returns correct variant for each mode', () => {
    expect(getDistributionBadgeVariant('single')).toBe('secondary')
    expect(getDistributionBadgeVariant('swarm')).toBe('default')
  })
})

describe('getPatternIcon', () => {
  it('returns CircleIcon for null', () => {
    expect(getPatternIcon(null)).toBe('CircleIcon')
  })

  it('returns correct icon for each pattern', () => {
    expect(getPatternIcon('sequential')).toBe('ListIcon')
    expect(getPatternIcon('tournament')).toBe('TrophyIcon')
    expect(getPatternIcon('cascade')).toBe('Rows2Icon')
  })
})
