import { timeAgo } from '@/lib/format'

const STALE_AFTER_MS = 36 * 3_600_000

export function UpdatedAt({ updatedAt, now }: { updatedAt: string; now: Date }) {
  const stale = now.getTime() - Date.parse(updatedAt) > STALE_AFTER_MS
  return (
    <p className="text-sm text-muted-foreground">
      <time dateTime={updatedAt} title={new Date(updatedAt).toLocaleString()}>
        Updated {timeAgo(updatedAt, now)}
      </time>
      {stale && (
        <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300">
          Data may be out of date
        </span>
      )}
    </p>
  )
}
