import { describe, expect, it } from 'vitest'
import { formatCount, timeAgo } from './format'

describe('formatCount', () => {
  it('adds thousands separators', () => {
    expect(formatCount(1234)).toBe('1,234')
    expect(formatCount(87)).toBe('87')
  })
})

describe('timeAgo', () => {
  const base = '2026-11-01T20:00:00.000Z'
  const after = (ms: number) => new Date(Date.parse(base) + ms)
  const H = 3_600_000
  it('says hours, days and just now', () => {
    expect(timeAgo(base, after(30_000))).toBe('just now')
    expect(timeAgo(base, after(5 * 60_000))).toBe('5 minutes ago')
    expect(timeAgo(base, after(1 * H))).toBe('1 hour ago')
    expect(timeAgo(base, after(3 * H))).toBe('3 hours ago')
    expect(timeAgo(base, after(26 * H))).toBe('1 day ago')
    expect(timeAgo(base, after(50 * H))).toBe('2 days ago')
  })
})
