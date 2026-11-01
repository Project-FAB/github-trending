import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCount } from '@/lib/format'
import type { SortKey } from '@/lib/rank'
import type { Repo } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  repos: Repo[]
  leader: Repo | null
  sortKey: SortKey
  onSort: (key: SortKey) => void
}

function SortButton({ short, rest, active, onClick }: { short: string; rest: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${short} ${rest}`}
      className={cn('inline-flex items-center justify-end gap-1 hover:text-foreground', active && 'text-foreground font-semibold')}
    >
      <span>
        {short}
        <span className="hidden sm:inline"> {rest}</span>
      </span>
      <span aria-hidden className={cn('text-xs', !active && 'invisible')}>▼</span>
    </button>
  )
}

export function LeaderboardTable({ repos, leader, sortKey, onSort }: Props) {
  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="w-8 text-right sm:w-10">#</TableHead>
          <TableHead>Repo</TableHead>
          <TableHead className="hidden w-32 sm:table-cell">Language</TableHead>
          <TableHead className="w-20 text-right sm:w-32">
            <SortButton short="Stars" rest="gained" active={sortKey === 'starsGained'} onClick={() => onSort('starsGained')} />
          </TableHead>
          <TableHead className="w-20 text-right sm:w-28">
            <SortButton short="Total" rest="stars" active={sortKey === 'stars'} onClick={() => onSort('stars')} />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {repos.map((repo, i) => {
          const isLeader = leader?.url === repo.url
          return (
            <TableRow key={repo.url} className={cn(isLeader && 'bg-amber-50 hover:bg-amber-100/70 dark:bg-amber-500/10 dark:hover:bg-amber-500/15')}>
              <TableCell className="text-right align-top tabular-nums text-muted-foreground">{i + 1}</TableCell>
              <TableCell className="align-top whitespace-normal">
                <div className="flex flex-wrap items-center gap-2">
                  <a href={repo.url} target="_blank" rel="noopener noreferrer" className="[overflow-wrap:anywhere] hover:underline">
                    <span className="text-muted-foreground">{repo.owner}/</span>
                    <wbr />
                    <span className="font-semibold">{repo.name}</span>
                  </a>
                  {isLeader && <Badge className="bg-amber-400 text-amber-950 hover:bg-amber-400">🥇 Leader</Badge>}
                </div>
                {repo.description && (
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground sm:line-clamp-2">{repo.description}</p>
                )}
              </TableCell>
              <TableCell className="hidden align-top sm:table-cell">
                {repo.language ? (
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: repo.languageColor ?? '#9ca3af' }} />
                    {repo.language}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right align-top font-semibold tabular-nums text-green-600 dark:text-green-400">
                +{formatCount(repo.starsGained)}
              </TableCell>
              <TableCell className="text-right align-top tabular-nums">{formatCount(repo.stars)}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
