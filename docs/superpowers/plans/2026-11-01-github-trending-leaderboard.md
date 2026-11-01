# GitHub Trending Leaderboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static Vercel site showing GitHub Trending (Day / Week / Month) as a leaderboard ranked by stars gained, refreshed daily by a GitHub Action.

**Architecture:** A Node/TS scraper (`scraper/`) parses the three Trending HTML pages into `data/trending.json`. A daily GitHub Action runs it and commits changes, and Vercel rebuilds on push. A Vite + React app imports the JSON at build time and does all sorting and filtering client-side.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind v4 (`@tailwindcss/vite`), shadcn/ui (tabs, table, select, badge), cheerio, tsx, Vitest + @testing-library/react + jsdom.

**Spec:** `docs/superpowers/specs/2026-11-01-github-trending-leaderboard-design.md`

## Global Constraints

- Free tiers only. No paid APIs, no database, no GitHub token for scraping.
- Source URLs: `https://github.com/trending?since=daily`, `?since=weekly`, `?since=monthly` (all languages).
- Default tab: **Day**. Default sort: **stars gained, descending**.
- The leader is the repo with the most `starsGained` in the current period after the language filter. Re-sorting does not move the leader badge.
- On any scrape failure or empty period, do **not** overwrite `data/trending.json`, and exit non-zero.
- Always show "Updated <time ago>".
- Cron: `0 20 * * *` (20:00 UTC), plus `workflow_dispatch`.
- Theme follows the system (`prefers-color-scheme`). On narrow screens (`< sm`), hide the Language column and clamp descriptions to one line.
- The repo is public. Creating the GitHub repo, pushing, connecting Vercel and `npm install` all need Fritz's go-ahead.

## Review Focus

1. A repo with **no description or no language** renders a muted "—" and doesn't crash (Task 2 parser test, Task 5 UI test).
2. **Comma numbers** such as "12,345" and "1,234 stars this week" parse to integers (Task 2).
3. **A language filter with no matches** in the newly selected tab shows "No <lang> repos in this period." instead of an empty table (Task 5).
4. **Ties in stars gained** are broken by total stars, descending (Task 4).
5. **GitHub changes its HTML**, so the parser returns 0 repos. The runner exits 1 and the file is untouched (Task 3). **Stale data** (> 36 h old) shows an amber "Data may be out of date" note (Task 5).

## Shared types — `src/lib/types.ts` (Task 1)

```ts
export type Period = 'daily' | 'weekly' | 'monthly'
export interface Repo {
  owner: string; name: string; url: string
  description: string | null; language: string | null; languageColor: string | null
  stars: number; forks: number; starsGained: number
}
export interface TrendingData { updatedAt: string; periods: Record<Period, Repo[]> }
```

---

### Task 1: Scaffold app, types and sample data

**Files:**
- Create: Vite React-TS project at repo root (`package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, `src/main.tsx`, `src/index.css`)
- Create: `src/lib/types.ts` (above), `data/trending.json` (sample: 3 repos per period, including one with `description: null, language: null`), `vitest.config.ts` (jsdom), `src/test/setup.ts`
- Test: `src/lib/types.test.ts`

**Interfaces:**
- Produces: `Period`, `Repo`, `TrendingData`. `data/trending.json` matches `TrendingData`.

- [ ] **Step 1: Ask Fritz before installing.** Then run `npm create vite@latest . -- --template react-ts`, install `tailwindcss @tailwindcss/vite`, set up the `@/` alias, run `npx shadcn@latest init` followed by `npx shadcn@latest add tabs table select badge`, and add the dev deps `vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event tsx cheerio`.
- [ ] **Step 2: Add scripts:** `"test": "vitest run"`, `"scrape": "tsx scraper/run.ts"`, `"build": "tsc -b && vite build"`.
- [ ] **Step 3: Write test** `sample data matches TrendingData`: import the JSON and assert that `Object.keys(data.periods)` equals `['daily','weekly','monthly']`, that each repo has numeric `stars`, `forks` and `starsGained`, and that `Date.parse(data.updatedAt)` is not NaN.
- [ ] **Step 4: Run** `npm test`. Expected: PASS. Run `npm run build`. Expected: succeeds.
- [ ] **Step 5: Commit** `chore: scaffold vite react app with shadcn and sample data`

### Task 2: Trending HTML parser

**Files:**
- Create: `scraper/parse.ts`
- Create: `scraper/fixtures/trending-daily.html` (save the real page with `curl -A "Mozilla/5.0" https://github.com/trending?since=daily`), plus a hand-trimmed `scraper/fixtures/edge.html` with 2 rows: one with no description and no language, and one with "12,345" stars and "1,234 stars this week"
- Test: `scraper/parse.test.ts`

**Interfaces:**
- Consumes: `Repo`
- Produces: `parseTrending(html: string): Repo[]` and `parseCount(text: string): number`

- [ ] **Step 1: Write tests:**
  - `parseCount`: `'12,345'`→`12345`, `' 1,234 stars this week '`→`1234`, `'87 stars today'`→`87`, `''`→`0`
  - `parseTrending(daily fixture)`: length > 0. Every repo has non-empty `owner`/`name`, `url === \`https://github.com/${owner}/${name}\``, `stars > 0`, and `starsGained >= 0`.
  - `parseTrending(edge fixture)`: the first repo has `description === null` and `language === null`. The second repo has `stars === 12345` and `starsGained === 1234`.
  - `parseTrending('<html></html>')` returns `[]`.
- [ ] **Step 2: Run** `npx vitest run scraper/parse.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement** with cheerio. Each row is `article.Box-row`. Name comes from `h2 a[href]` (split the href into owner/name), description from `p`, language from `[itemprop=programmingLanguage]`, language color from the `.repo-language-color` inline `background-color`, stars and forks from `a[href$="/stargazers"]` / `a[href$="/forks"]`, and starsGained from the trailing `span` that contains "stars". Trim whitespace, and turn empty strings into `null`.
- [ ] **Step 4: Run tests.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(scraper): parse github trending html`

### Task 3: Scraper runner (safe write)

**Files:**
- Create: `scraper/run.ts` (CLI entry: calls `scrapeAll` and `writeData('data/trending.json')`, exits 1 on throw), `scraper/scrape.ts`
- Test: `scraper/scrape.test.ts`

**Interfaces:**
- Consumes: `parseTrending`, `TrendingData`, `Period`
- Produces: `scrapeAll(fetchHtml: (url: string) => Promise<string>, now?: Date): Promise<TrendingData>` (throws if any period has 0 repos or a fetch fails) and `writeData(path: string, data: TrendingData): Promise<void>` (writes to `path + '.tmp'`, then renames)

- [ ] **Step 1: Write tests** using a fake `fetchHtml` that returns fixtures:
  - all three periods return the daily fixture: `updatedAt === now.toISOString()` and every period length > 0; the fake was called with the 3 exact URLs from Global Constraints
  - weekly returns `'<html></html>'`: `scrapeAll` rejects with a message containing `weekly`
  - a fetch rejects: `scrapeAll` rejects
  - `writeData` to a temp dir: the file contains `JSON.stringify(data, null, 2) + '\n'`
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** The real `fetchHtml` in `run.ts` uses global `fetch` with a `User-Agent` header and throws on `!res.ok`.
- [ ] **Step 4: Run tests.** Expected: PASS. Run `npm run scrape` and check that `data/trending.json` now holds real data for all 3 periods.
- [ ] **Step 5: Commit** `feat(scraper): scrape all periods and write data safely`

### Task 4: Ranking logic

**Files:**
- Create: `src/lib/rank.ts`
- Test: `src/lib/rank.test.ts`

**Interfaces:**
- Consumes: `Repo`
- Produces:
  - `type SortKey = 'starsGained' | 'stars'`
  - `sortRepos(repos: Repo[], key: SortKey): Repo[]` (descending; ties broken by the other key, descending; returns a new array)
  - `getLeader(repos: Repo[]): Repo | null` (max `starsGained` with the same tiebreak)
  - `filterByLanguage(repos: Repo[], lang: string | null): Repo[]` (`null` means all)
  - `listLanguages(repos: Repo[]): string[]` (unique, non-null, A–Z)

- [ ] **Step 1: Write tests:**
  - sort by starsGained: `[a(5 gained, 10 total), b(9, 1), c(5, 50)]` gives `[b, c, a]`
  - sort by stars gives `[c, a, b]`
  - `getLeader` of that list is `b`, regardless of input order
  - `getLeader([])` is `null`
  - `filterByLanguage(list, 'Go')` keeps only Go repos, and `filterByLanguage(list, null)` keeps all
  - `listLanguages` drops null and dedupes
- [ ] **Step 2: Run.** Expected: FAIL. **Step 3: Implement.** **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: ranking, leader and language filter logic`

### Task 5: Leaderboard UI

**Files:**
- Create: `src/components/Leaderboard.tsx`, `src/components/LeaderboardTable.tsx`, `src/components/UpdatedAt.tsx`, `src/lib/format.ts`
- Modify: `src/App.tsx` (renders `<Leaderboard data={trending} />` with the imported JSON), `index.html` (`<title>GitHub Trending Leaderboard</title>`)
- Test: `src/components/Leaderboard.test.tsx`, `src/lib/format.test.ts`

**Interfaces:**
- Consumes: `TrendingData`, `sortRepos`, `getLeader`, `filterByLanguage`, `listLanguages`
- Produces: `Leaderboard({ data, now = new Date() }: { data: TrendingData; now?: Date })`, `formatCount(n: number): string` (`1234`→`"1,234"`), `timeAgo(iso: string, now: Date): string` (`"3 hours ago"`, `"2 days ago"`)

Layout: a header with the title "GitHub Trending" and `UpdatedAt`; a row with shadcn `Tabs` (Day / Week / Month) and a `Select` ("All languages" plus `listLanguages`); then the table. Columns: `#`, Repo (link opens in a new tab, `rel="noopener noreferrer"`, description below in muted text, `line-clamp-1` on mobile), Language (dot + name, `hidden sm:table-cell`), **Stars gained** (green `+1,234`), Total stars. The two star headers are buttons that set the sort. The active one shows ▼. The leader row gets a tinted background and a `Badge` "🥇 Leader". Dark mode uses Tailwind's `dark:` variant via a media query.

- [ ] **Step 1: Write tests** (using the Task 1 sample fixture with a fixed `now`):
  - by default the Day tab is selected; the first body row contains the repo with the highest daily `starsGained`, and that row contains "Leader"
  - clicking "Total stars" re-orders rows by `stars`, and the "Leader" badge stays on the same repo
  - clicking the "Week" tab shows weekly repos
  - choosing a language shows only that language; switching to a tab with no repos in that language shows `No <lang> repos in this period.`
  - a repo with null description and language renders "—" and doesn't throw
  - `UpdatedAt` shows "Updated 3 hours ago" when `now` is 3 h after `updatedAt`, and shows "Data may be out of date" when it's 37 h after
  - `formatCount` and `timeAgo` unit tests with the values above
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** The language filter persists across tabs. Rank numbers follow the current sort.
- [ ] **Step 4: Run** `npm test`. Expected: all PASS. Run `npm run build`. Expected: succeeds. Run `npm run dev` and check in a browser at desktop and phone widths, in light and dark mode.
- [ ] **Step 5: Commit** `feat: leaderboard ui with tabs, sorting and language filter`

### Task 6: Daily Action and deploy

**Files:**
- Create: `.github/workflows/scrape.yml`, `README.md` (what it is, how to run locally, how the daily update works)

**Interfaces:**
- Consumes: `npm run scrape`, `npm test`

- [ ] **Step 1: Write the workflow:** `on: schedule: cron '0 20 * * *'` plus `workflow_dispatch`; `permissions: contents: write`; steps: checkout, setup-node 20 with npm cache, `npm ci`, `npm run scrape`, then commit `data/trending.json` as `github-actions[bot]` with the message `data: update trending YYYY-MM-DD` **only if** `git diff --quiet` reports changes, then push.
- [ ] **Step 2: Validate locally:** `npx --yes action-validator .github/workflows/scrape.yml` (or `actionlint` if installed). Expected: no errors.
- [ ] **Step 3: Commit** `ci: daily trending scrape`
- [ ] **Step 4: Ask Fritz first.** Then run `gh repo create github-trending --public --source . --push`.
- [ ] **Step 5: Ask Fritz first.** Then connect to Vercel (`npx vercel link` and `npx vercel --prod`, or import in the Vercel dashboard). Framework: Vite, output `dist`. Fritz may need to log in.
- [ ] **Step 6: Verify end to end:** `gh workflow run scrape.yml`, then `gh run watch` → success. A new data commit appears (or "no changes"), Vercel shows a new deployment, and the live URL shows today's data with a fresh "Updated" time.
