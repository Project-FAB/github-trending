import { rename, writeFile } from 'node:fs/promises'
import type { Period, Repo, TrendingData } from '../src/lib/types'
import { parseTrending } from './parse'

export const PERIODS: Period[] = ['daily', 'weekly', 'monthly']
export const trendingUrl = (period: Period) => `https://github.com/trending?since=${period}`

/** Fetches and parses all three periods. Throws if any fetch fails, or any period has no repos or broken star counts. */
export async function scrapeAll(
  fetchHtml: (url: string) => Promise<string>,
  now: Date = new Date(),
): Promise<TrendingData> {
  const lists = await Promise.all(
    PERIODS.map(async (period) => {
      const repos = parseTrending(await fetchHtml(trendingUrl(period)))
      if (repos.length === 0) throw new Error(`No repos parsed for ${period}`)
      // A partial page change can leave rows parseable but numbers missing; don't publish zeros.
      if (repos.some((r) => r.stars === 0) || repos.every((r) => r.starsGained === 0)) {
        throw new Error(`Bad star counts parsed for ${period}`)
      }
      return repos
    }),
  )
  const periods = Object.fromEntries(PERIODS.map((p, i) => [p, lists[i]])) as Record<Period, Repo[]>
  return { updatedAt: now.toISOString(), periods }
}

/** Writes to a temp file first, then renames, so a crash never leaves a half-written file. */
export async function writeData(path: string, data: TrendingData): Promise<void> {
  const tmp = `${path}.tmp`
  await writeFile(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8')
  await rename(tmp, path)
}
