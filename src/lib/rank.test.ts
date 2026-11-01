import { describe, expect, it } from 'vitest'
import { filterByLanguage, getLeader, listLanguages, sortRepos } from './rank'
import type { Repo } from './types'

const repo = (name: string, starsGained: number, stars: number, language: string | null = null): Repo => ({
  owner: 'o', name, url: `https://github.com/o/${name}`, description: null,
  language, languageColor: null, stars, forks: 0, starsGained,
})

const a = repo('a', 5, 10, 'Go')
const b = repo('b', 9, 1, 'Rust')
const c = repo('c', 5, 50, 'Go')
const names = (rs: Repo[]) => rs.map((r) => r.name)

describe('sortRepos', () => {
  it('sorts by stars gained, ties broken by total stars', () => {
    expect(names(sortRepos([a, b, c], 'starsGained'))).toEqual(['b', 'c', 'a'])
  })
  it('sorts by total stars', () => {
    expect(names(sortRepos([a, b, c], 'stars'))).toEqual(['c', 'a', 'b'])
  })
  it('does not mutate the input', () => {
    const input = [a, b, c]
    sortRepos(input, 'stars')
    expect(names(input)).toEqual(['a', 'b', 'c'])
  })
})

describe('getLeader', () => {
  it('picks the top stars gained regardless of order', () => {
    expect(getLeader([a, c, b])?.name).toBe('b')
    expect(getLeader([b, a, c])?.name).toBe('b')
  })
  it('breaks ties by total stars', () => {
    expect(getLeader([a, c])?.name).toBe('c')
  })
  it('returns null for an empty list', () => {
    expect(getLeader([])).toBeNull()
  })
})

describe('filterByLanguage', () => {
  it('keeps only the chosen language', () => {
    expect(names(filterByLanguage([a, b, c], 'Go'))).toEqual(['a', 'c'])
  })
  it('keeps everything when no language is chosen', () => {
    expect(names(filterByLanguage([a, b, c], null))).toEqual(['a', 'b', 'c'])
  })
})

describe('listLanguages', () => {
  it('returns unique non-null languages A–Z', () => {
    expect(listLanguages([b, a, c, repo('d', 1, 1)])).toEqual(['Go', 'Rust'])
  })
})
