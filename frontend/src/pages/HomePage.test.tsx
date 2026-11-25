import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App.tsx'
import * as eventsApi from '../api/events.ts'
import type { EventSummary } from '../api/types.ts'

const venue = { name: 'Jubilee Hall', city: 'Mumbai' }
const hours = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString()
const ev = (id: string, name: string, h: number, min = 50000, max = 125000): EventSummary => ({
  id,
  name,
  starts_at: hours(h),
  venue,
  min_price_cents: min,
  max_price_cents: max,
})

function renderHome() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(eventsApi, 'getEvent').mockImplementation(async (id) =>
      id === 'b' ? ev('b', 'Beta', 48) : undefined,
    )
  })

  it('shows name, venue, city, date/time and price range', async () => {
    vi.spyOn(eventsApi, 'listEvents').mockResolvedValue([ev('a', 'Alpha', 24)])
    renderHome()
    const item = await screen.findByRole('listitem')
    expect(within(item).getByText('Alpha')).toBeInTheDocument()
    expect(within(item).getByText('Jubilee Hall, Mumbai')).toBeInTheDocument()
    expect(within(item).getByText('₹500.00 – ₹1,250.00')).toBeInTheDocument()
    expect(within(item).getByText(/\d{4}/)).toBeInTheDocument()
  })

  it('shows a single price when min equals max', async () => {
    vi.spyOn(eventsApi, 'listEvents').mockResolvedValue([ev('a', 'Alpha', 24, 40000, 40000)])
    renderHome()
    expect(await screen.findByText('₹400.00')).toBeInTheDocument()
  })

  it('hides past events and sorts ascending', async () => {
    vi.spyOn(eventsApi, 'listEvents').mockResolvedValue([
      ev('c', 'Gamma', 72),
      ev('p', 'Past', -5),
      ev('a', 'Alpha', 24),
      ev('b', 'Beta', 48),
    ])
    renderHome()
    const items = await screen.findAllByRole('listitem')
    expect(items.map((i) => within(i).getByRole('heading').textContent)).toEqual([
      'Alpha',
      'Beta',
      'Gamma',
    ])
    expect(screen.queryByText('Past')).not.toBeInTheDocument()
  })

  it('navigates to /events/:id on click', async () => {
    vi.spyOn(eventsApi, 'listEvents').mockResolvedValue([ev('b', 'Beta', 48)])
    renderHome()
    const link = await screen.findByRole('link', { name: /beta/i })
    expect(link).toHaveAttribute('href', '/events/b')
    await userEvent.click(link)
    expect(await screen.findByRole('heading', { name: 'Beta' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Legend' })).toBeInTheDocument()
  })

  it('shows an error with Retry that refetches', async () => {
    const spy = vi
      .spyOn(eventsApi, 'listEvents')
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue([ev('a', 'Alpha', 24)])
    renderHome()
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't load events/i)
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('Alpha')).toBeInTheDocument()
    expect(spy).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows an empty state when there are no upcoming events', async () => {
    vi.spyOn(eventsApi, 'listEvents').mockResolvedValue([ev('p', 'Past', -5)])
    renderHome()
    expect(await screen.findByText('No upcoming events')).toBeInTheDocument()
  })
})
