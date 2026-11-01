import { describe, expect, it } from 'vitest'
import raw from '../../data/trending.json'
import type { TrendingData } from './types'

const data = raw as TrendingData

describe('sample data', () => {
  it('matches TrendingData', () => {
    expect(Object.keys(data.periods)).toEqual(['daily', 'weekly', 'monthly'])
    for (const repos of Object.values(data.periods)) {
      expect(repos.length).toBeGreaterThan(0)
      for (const r of repos) {
        expect(typeof r.stars).toBe('number')
        expect(typeof r.forks).toBe('number')
        expect(typeof r.starsGained).toBe('number')
      }
    }
    expect(Number.isNaN(Date.parse(data.updatedAt))).toBe(false)
  })
})
