export type Period = 'daily' | 'weekly' | 'monthly'

export interface Repo {
  owner: string
  name: string
  url: string
  description: string | null
  language: string | null
  languageColor: string | null
  stars: number
  forks: number
  starsGained: number
}

export interface TrendingData {
  updatedAt: string
  periods: Record<Period, Repo[]>
}
