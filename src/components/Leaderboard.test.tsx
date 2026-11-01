import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { TrendingData } from '@/lib/types'
import sample from '@/test/sample-data.json'
import { Leaderboard } from './Leaderboard'

const data = sample as TrendingData
const H = 3_600_000
const at = (hours: number) => new Date(Date.parse(data.updatedAt) + hours * H)

const bodyRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1)
const rowNames = () => bodyRows().map((r) => within(r).getByRole('link').textContent)

describe('Leaderboard', () => {
  it('shows the Day tab ranked by stars gained, with the leader first', () => {
    render(<Leaderboard data={data} now={at(3)} />)
    expect(screen.getByRole('tab', { name: 'Day' })).toHaveAttribute('aria-selected', 'true')
    expect(rowNames()).toEqual(['someone/awesome-list', 'ollama/ollama', 'facebook/react'])
    expect(within(bodyRows()[0]).getByText(/Leader/)).toBeInTheDocument()
  })

  it('re-sorts by total stars but keeps the leader badge on the top gainer', async () => {
    render(<Leaderboard data={data} now={at(3)} />)
    await userEvent.click(screen.getByRole('button', { name: /Total stars/ }))
    expect(rowNames()).toEqual(['facebook/react', 'ollama/ollama', 'someone/awesome-list'])
    expect(within(bodyRows()[2]).getByText(/Leader/)).toBeInTheDocument()
    expect(within(bodyRows()[0]).queryByText(/Leader/)).toBeNull()
  })

  it('shows weekly repos on the Week tab', async () => {
    render(<Leaderboard data={data} now={at(3)} />)
    await userEvent.click(screen.getByRole('tab', { name: 'Week' }))
    expect(rowNames()).toEqual(['ollama/ollama', 'astral-sh/uv'])
  })

  it('filters by language and explains an empty result on another tab', async () => {
    render(<Leaderboard data={data} now={at(3)} />)
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByRole('option', { name: 'Go' }))
    expect(rowNames()).toEqual(['ollama/ollama'])
    await userEvent.click(screen.getByRole('tab', { name: 'Month' }))
    expect(screen.getByText('No Go repos in this period.')).toBeInTheDocument()
  })

  it('shows a dash for a repo with no language', () => {
    render(<Leaderboard data={data} now={at(3)} />)
    expect(within(bodyRows()[0]).getByText('—')).toBeInTheDocument()
  })

  it('shows formatted stars gained and total stars', () => {
    render(<Leaderboard data={data} now={at(3)} />)
    expect(within(bodyRows()[1]).getByText('+890')).toBeInTheDocument()
    expect(within(bodyRows()[1]).getByText('158,000')).toBeInTheDocument()
  })

  it('shows when the data was updated', () => {
    render(<Leaderboard data={data} now={at(3)} />)
    expect(screen.getByText('Updated 3 hours ago')).toBeInTheDocument()
    expect(screen.queryByText(/may be out of date/)).toBeNull()
  })

  it('warns when the data is more than 36 hours old', () => {
    render(<Leaderboard data={data} now={at(37)} />)
    expect(screen.getByText(/Data may be out of date/)).toBeInTheDocument()
  })
})
