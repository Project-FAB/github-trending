import { Leaderboard } from '@/components/Leaderboard'
import type { TrendingData } from '@/lib/types'
import trending from '../data/trending.json'

export default function App() {
  return <Leaderboard data={trending as TrendingData} />
}
