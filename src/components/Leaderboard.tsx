import { useMemo, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { filterByLanguage, getLeader, listLanguages, sortRepos, type SortKey } from '@/lib/rank'
import type { Period, TrendingData } from '@/lib/types'
import { LeaderboardTable } from './LeaderboardTable'
import { UpdatedAt } from './UpdatedAt'

const TABS: { value: Period; label: string }[] = [
  { value: 'daily', label: 'Day' },
  { value: 'weekly', label: 'Week' },
  { value: 'monthly', label: 'Month' },
]
const ALL = '__all__'

export function Leaderboard({ data, now = new Date() }: { data: TrendingData; now?: Date }) {
  const [period, setPeriod] = useState<Period>('daily')
  const [sortKey, setSortKey] = useState<SortKey>('starsGained')
  const [language, setLanguage] = useState<string | null>(null)

  // Languages from every period, so a chosen language stays selectable when switching tabs.
  const languages = useMemo(() => listLanguages(Object.values(data.periods).flat()), [data])
  const visible = filterByLanguage(data.periods[period], language)
  const leader = getLeader(visible)
  const rows = sortRepos(visible, sortKey)

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">GitHub Trending</h1>
        <p className="mt-1 text-muted-foreground">Who's gaining the most stars right now.</p>
        <div className="mt-2">
          <UpdatedAt updatedAt={data.updatedAt} now={now} />
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs className="w-full sm:w-auto" value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList className="w-full sm:w-auto">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Select value={language ?? ALL} onValueChange={(v) => setLanguage(v === ALL ? null : v)}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All languages</SelectItem>
            {languages.map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {rows.length > 0 ? (
        <div className="rounded-lg border">
          <LeaderboardTable repos={rows} leader={leader} sortKey={sortKey} onSort={setSortKey} />
        </div>
      ) : (
        <p className="rounded-lg border p-8 text-center text-muted-foreground">
          {language ? `No ${language} repos in this period.` : 'No repos in this period.'}
        </p>
      )}
    </main>
  )
}
