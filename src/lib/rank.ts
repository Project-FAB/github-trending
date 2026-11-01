import type { Repo } from './types'

export type SortKey = 'starsGained' | 'stars'

const other = (key: SortKey): SortKey => (key === 'stars' ? 'starsGained' : 'stars')

/** Highest first; ties broken by the other star count. Returns a new array. */
export function sortRepos(repos: Repo[], key: SortKey): Repo[] {
  const tie = other(key)
  return [...repos].sort((x, y) => y[key] - x[key] || y[tie] - x[tie])
}

/** The repo that gained the most stars (ties → more total stars). */
export function getLeader(repos: Repo[]): Repo | null {
  return sortRepos(repos, 'starsGained')[0] ?? null
}

export function filterByLanguage(repos: Repo[], lang: string | null): Repo[] {
  return lang === null ? repos : repos.filter((r) => r.language === lang)
}

export function listLanguages(repos: Repo[]): string[] {
  const langs = new Set(repos.map((r) => r.language).filter((l): l is string => l !== null))
  return [...langs].sort((x, y) => x.localeCompare(y))
}
