# GitHub Trending Leaderboard — Design

Date: 2026-11-01 · Owner: Fritz

## Intent

A small web app that shows **who's leading GitHub Trending** for today, this week and this
month. It's a quick check you can do from a laptop or phone: open the page and see which repos are
gaining stars fastest right now.

No existing tool does this as a simple, ranked, always-up-to-date page. GitHub's own Trending page
uses its own ordering. It does not rank by stars gained, and it has no leaderboard feel.

## Goals

- A **leaderboard table** of trending repos (Fritz picked this over a card grid or a daily-report layout).
- **Three tabs: Day / Week / Month.** These map to GitHub Trending's `since=daily`, `since=weekly`
  and `since=monthly` lists.
- **Ranked by stars gained in that period**, highest first. The **#1 repo is "the leader"** and is
  visually highlighted (Fritz's decision: the leader is the repo with the most stars gained, not the
  most total stars).
- Data refreshes **automatically once a day**, with no manual steps.
- Hosted on **Vercel** (Fritz's decision), so it works from any device.
- Built with **React + shadcn/ui** (Fritz's decision).

## Non-goals

- No history or archive of past dates. The three period tabs are enough.
- No accounts, logins, notifications, emails or Slack posts.
- No database.
- No paid services or paid APIs (workspace rule: ask before anything that costs money).

## Anti-goals (would count as failure even if it "works")

- The page silently shows old data. It must always show when the data was last updated.
- One failed scrape breaks the site or wipes the list. On failure, keep the last good data.
- The page is cluttered or slow on a phone.

## Constraints

- GitHub has no API for Trending, so the data comes from scraping the HTML at
  `https://github.com/trending?since=daily|weekly|monthly`. The page already shows each repo's
  owner/name, description, language, total stars, forks and "N stars today / this week / this month".
  No GitHub API token is needed.
- Free tiers only (Vercel Hobby, GitHub Actions on a public or private repo within free minutes).
- Fritz prefers plain, simple things, so the UI should be self-explanatory with no jargon.

## How it works (decided)

### Screen

One page:

- **Header:** the title, a "Updated <time ago>" note, and the **Day / Week / Month** tabs (shadcn `Tabs`).
  The default tab is **Day**.
- **Leader highlight:** the #1 row stands out, e.g. with a crown/🥇 badge and a tinted row.
  *Builder's call:* whether the highlight sits on the row itself or in a small card above the table.
- **Table** (shadcn `Table`) with these columns:
  1. Rank (#)
  2. Repo: `owner/name` as a link that opens GitHub in a new tab, with the description in muted text
     below it
  3. Language, with a colour dot
  4. **Stars gained** (period): the default sort column, shown in green as "+1,234"
  5. Total stars
- **Re-sorting:** clicking the "Stars gained" or "Total stars" header re-sorts the table. Rank numbers
  follow the current sort.

### Data pipeline

- A **GitHub Actions workflow** runs on a daily cron. It also has a manual "Run workflow" button
  (`workflow_dispatch`).
- A small **Node/TypeScript scraper** (using `cheerio`) fetches the three Trending pages (all
  languages), parses them, and writes one file, `data/trending.json`:
  ```json
  {
    "updatedAt": "2026-11-01T20:00:00Z",
    "periods": {
      "daily":   [{ "owner": "", "name": "", "url": "", "description": "", "language": "",
                    "languageColor": "", "stars": 0, "forks": 0, "starsGained": 0 }],
      "weekly":  [],
      "monthly": []
    }
  }
  ```
- If any period fails to parse or comes back empty, the scraper **exits with an error and does not
  overwrite** the file. The previous data stays live, and the failed Action run is visible on GitHub.
- When the data changes, the workflow commits the file. Vercel's Git integration then rebuilds and
  redeploys the site.
- The React app imports `data/trending.json` at build time and does all sorting and filtering in the browser.

### Stack

- **Vite + React + TypeScript + Tailwind + shadcn/ui** as a static site. No server code is needed.
- Code lives at `~/workspace/Code/github-trending`, in its own Git repo, pushed to a **public** GitHub repo
  (Fritz's decision) and connected to Vercel. Because the repo is public, Vercel's Git integration rebuilds
  on the Action's bot commits, so no deploy hook is needed.

## My calls (Claude's, not confirmed by Fritz)

- **Language filter:** a dropdown next to the tabs that filters the current list by language
  (client-side, built from the languages in the data). Easy to drop if unwanted.
- **Cron time:** 20:00 UTC (≈ 6–7 am in eastern Australia), so the data is fresh in the morning.
- **The leader is fixed per view:** it's the repo with the most stars gained in the selected period (after
  the language filter, if one is set). Re-sorting by Total stars does **not** move the leader badge.
- **Theme:** follows the system light/dark setting.
- **Phone layout:** the table hides the Language column on narrow screens and truncates descriptions to one line.
- **Daily rebuild through a commit** (GitHub Actions) was picked over Vercel Cron + Blob storage. It is
  simpler, free, and keeps a plain JSON file you can read.
- **Vite** was picked over Next.js because the site is fully static.

## Left to the builder

- The exact scraping selectors and number parsing ("1,234 stars today", "1.2k" totals), plus a test
  against a saved HTML fixture so selector breakage shows up.
- The exact leader-highlight styling, empty/loading states, and the favicon.
- Repo/project naming on GitHub and Vercel.

## Needs Fritz's go-ahead at build time

- Creating the public GitHub repo and pushing to it (publishing).
- Connecting the repo to Vercel and deploying (publishing; Fritz may need to log in).
- Installing npm packages (installing tools).
