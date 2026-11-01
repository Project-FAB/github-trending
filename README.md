# GitHub Trending Leaderboard

A simple leaderboard of [GitHub Trending](https://github.com/trending) repos. It's ranked by
**stars gained** today, this week or this month, and the top repo is marked as the 🥇 leader.

## How it updates

1. Every day at 20:00 UTC, the GitHub Action in `.github/workflows/scrape.yml` runs `npm run scrape`.
2. The scraper reads `github.com/trending?since=daily|weekly|monthly` and writes `data/trending.json`.
   If anything goes wrong, it stops and leaves the old file in place.
3. When the data changed, the Action commits it, and Vercel rebuilds the site automatically.

To run an update by hand, open **Actions → Daily trending scrape → Run workflow** on GitHub.

## Run it locally

```bash
npm install
npm run scrape   # fetch fresh data into data/trending.json
npm run dev      # open http://localhost:5173
npm test         # run the tests
```

## Stack

Vite, React, TypeScript, Tailwind and shadcn/ui. The scraper uses cheerio. The site is fully
static: it reads the JSON at build time, so there's no server or database.
