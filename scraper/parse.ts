import * as cheerio from 'cheerio'
import type { Repo } from '../src/lib/types'

/** "1,234 stars this week" → 1234. Returns 0 when there is no number. */
export function parseCount(text: string): number {
  const match = text.replace(/,/g, '').match(/\d+/)
  return match ? Number(match[0]) : 0
}

const clean = (text: string | undefined): string | null => {
  const t = text?.replace(/\s+/g, ' ').trim()
  return t ? t : null
}

export function parseTrending(html: string): Repo[] {
  const $ = cheerio.load(html)
  const repos: Repo[] = []

  $('article.Box-row').each((_, el) => {
    const row = $(el)
    const href = row.find('h2 a').attr('href') ?? ''
    const [owner, name] = href.split('/').filter(Boolean)
    if (!owner || !name) return

    const colorStyle = row.find('.repo-language-color').attr('style') ?? ''
    const gainedText = row
      .find('span')
      .filter((_, s) => /stars?\s+(today|this week|this month)/i.test($(s).text()))
      .last()
      .text()

    repos.push({
      owner,
      name,
      url: `https://github.com/${owner}/${name}`,
      description: clean(row.find('p').first().text()),
      language: clean(row.find('[itemprop=programmingLanguage]').text()),
      languageColor: colorStyle.match(/#[0-9a-f]{3,8}/i)?.[0] ?? null,
      stars: parseCount(row.find('a[href$="/stargazers"]').text()),
      forks: parseCount(row.find('a[href$="/forks"]').text()),
      starsGained: parseCount(gainedText),
    })
  })

  return repos
}
