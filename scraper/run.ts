import { scrapeAll, writeData } from './scrape'

const OUT = 'data/trending.json'

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (github-trending-leaderboard)', Accept: 'text/html' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

try {
  const data = await scrapeAll(fetchHtml)
  await writeData(OUT, data)
  const counts = Object.entries(data.periods).map(([p, r]) => `${p}=${r.length}`).join(' ')
  console.log(`Wrote ${OUT} (${counts})`)
} catch (err) {
  console.error(`Scrape failed, ${OUT} left unchanged:`, err instanceof Error ? err.message : err)
  process.exit(1)
}
