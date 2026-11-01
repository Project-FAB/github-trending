// @vitest-environment node
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { scrapeAll, writeData } from './scrape'

const daily = readFileSync(join(__dirname, 'fixtures', 'trending-daily.html'), 'utf8')
const now = new Date('2026-11-01T20:00:00.000Z')

describe('scrapeAll', () => {
  it('scrapes the three trending periods', async () => {
    const urls: string[] = []
    const data = await scrapeAll(async (url) => { urls.push(url); return daily }, now)
    expect(urls.sort()).toEqual([
      'https://github.com/trending?since=daily',
      'https://github.com/trending?since=monthly',
      'https://github.com/trending?since=weekly',
    ])
    expect(data.updatedAt).toBe(now.toISOString())
    expect(Object.keys(data.periods)).toEqual(['daily', 'weekly', 'monthly'])
    for (const repos of Object.values(data.periods)) expect(repos.length).toBeGreaterThan(0)
  })

  it('rejects when a period comes back empty', async () => {
    const fetchHtml = async (url: string) => (url.endsWith('weekly') ? '<html></html>' : daily)
    await expect(scrapeAll(fetchHtml, now)).rejects.toThrow(/weekly/)
  })

  it('rejects when star counts stop parsing (partial HTML change)', async () => {
    const broken = daily.replaceAll('/stargazers"', '/stars"')
    await expect(scrapeAll(async () => broken, now)).rejects.toThrow(/star counts/)
  })

  it('rejects when every repo shows zero stars gained', async () => {
    const broken = daily.replace(/[\d,]+ stars today/g, 'stars today')
    await expect(scrapeAll(async () => broken, now)).rejects.toThrow(/star counts/)
  })

  it('rejects when a fetch fails', async () => {
    await expect(scrapeAll(async () => { throw new Error('HTTP 503') }, now)).rejects.toThrow(/503/)
  })
})

describe('writeData', () => {
  it('writes pretty JSON with a trailing newline', async () => {
    const path = join(mkdtempSync(join(tmpdir(), 'trend-')), 'trending.json')
    const data = await scrapeAll(async () => daily, now)
    await writeData(path, data)
    expect(readFileSync(path, 'utf8')).toBe(JSON.stringify(data, null, 2) + '\n')
  })
})
