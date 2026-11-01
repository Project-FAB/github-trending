import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseCount, parseTrending } from './parse'

const fixture = (name: string) => readFileSync(join(__dirname, 'fixtures', name), 'utf8')

describe('parseCount', () => {
  it('parses plain, comma and labelled counts', () => {
    expect(parseCount('12,345')).toBe(12345)
    expect(parseCount(' 1,234 stars this week ')).toBe(1234)
    expect(parseCount('87 stars today')).toBe(87)
    expect(parseCount('')).toBe(0)
  })
})

describe('parseTrending', () => {
  it('parses every repo on the real daily page', () => {
    const repos = parseTrending(fixture('trending-daily.html'))
    expect(repos.length).toBeGreaterThan(0)
    for (const r of repos) {
      expect(r.owner).not.toBe('')
      expect(r.name).not.toBe('')
      expect(r.url).toBe(`https://github.com/${r.owner}/${r.name}`)
      expect(r.stars).toBeGreaterThan(0)
      expect(r.starsGained).toBeGreaterThanOrEqual(0)
    }
    expect(repos[0]).toMatchObject({
      owner: 'thedotmack', name: 'claude-mem', language: 'TypeScript',
      languageColor: '#3178c6', stars: 108361, forks: 9505, starsGained: 1723,
    })
  })

  it('handles missing description/language and comma numbers', () => {
    const [a, b] = parseTrending(fixture('edge.html'))
    expect(a.description).toBeNull()
    expect(a.language).toBeNull()
    expect(a.languageColor).toBeNull()
    expect(a.starsGained).toBe(87)
    expect(b.description).toBe('A big repo.')
    expect(b.stars).toBe(12345)
    expect(b.forks).toBe(1001)
    expect(b.starsGained).toBe(1234)
  })

  it('returns [] for a page with no repos', () => {
    expect(parseTrending('<html></html>')).toEqual([])
  })
})
