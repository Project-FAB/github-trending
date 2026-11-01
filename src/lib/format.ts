export const formatCount = (n: number): string => n.toLocaleString('en-US')

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'} ago`

export function timeAgo(iso: string, now: Date): string {
  const minutes = Math.floor((now.getTime() - Date.parse(iso)) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return plural(minutes, 'minute')
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return plural(hours, 'hour')
  return plural(Math.floor(hours / 24), 'day')
}
