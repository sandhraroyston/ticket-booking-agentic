import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App.tsx'
import * as eventsApi from '../api/events.ts'
import * as seatsApi from '../api/seats.ts'
import type { Seat } from '../api/types.ts'
import { renderHook, act } from '@testing-library/react'
import { useSeatSelection } from './useSeatSelection.ts'

const seat = (n: number, status: Seat['status'] = 'available'): Seat => ({
  id: `A-1-${n}`,
  section: 'A',
  row: '1',
  number: n,
  price_cents: 75000,
  status,
})
const seats: Seat[] = [
  ...Array.from({ length: 8 }, (_, i) => seat(i + 1)),
  seat(9, 'held'),
  seat(10, 'sold'),
]

function renderEvent(id: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/events/${id}`]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('EventPage seat map', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(eventsApi, 'getEvent').mockImplementation(async (id) =>
      id === 'e1'
        ? {
            id: 'e1',
            name: 'Jazz',
            starts_at: new Date(Date.now() + 86_400_000).toISOString(),
            venue: { name: 'Hall', city: 'Mumbai' },
            min_price_cents: 75000,
            max_price_cents: 75000,
          }
        : undefined,
    )
    vi.spyOn(seatsApi, 'getEventSeats').mockResolvedValue(seats)
  })

  it('renders statuses with accessible labels and a legend', async () => {
    renderEvent('e1')
    expect(
      await screen.findByRole('button', { name: 'Section A, row 1, seat 1, ₹750.00, available' }),
    ).toBeEnabled()
    expect(screen.getByRole('button', { name: /seat 9, .*held/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /seat 10, .*sold/ })).toBeDisabled()
    expect(screen.getByRole('list', { name: 'Legend' })).toHaveTextContent(/Available.*Selected.*Held.*Sold/)
    expect(screen.getByRole('heading', { name: 'Section A' })).toBeInTheDocument()
  })

  it('toggles selection and shows count and total', async () => {
    const user = userEvent.setup()
    renderEvent('e1')
    const s1 = await screen.findByRole('button', { name: /seat 1,/ })
    await user.click(s1)
    await user.click(screen.getByRole('button', { name: /seat 2,/ }))
    expect(s1).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('2 seats selected')).toBeInTheDocument()
    expect(screen.getByText('Total: ₹1,500.00')).toBeInTheDocument()
    await user.click(s1)
    expect(s1).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('1 seat selected')).toBeInTheDocument()
  })

  it('blocks a 7th seat with a message, cleared on deselect; held/sold select nothing', async () => {
    const user = userEvent.setup()
    renderEvent('e1')
    await screen.findByRole('button', { name: /seat 1,/ })
    for (let n = 1; n <= 6; n++) await user.click(screen.getByRole('button', { name: new RegExp(`seat ${n},`) }))
    await user.click(screen.getByRole('button', { name: /seat 7,/ }))
    expect(screen.getByRole('alert')).toHaveTextContent('You can hold up to 6 seats')
    expect(screen.getByText('6 seats selected')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /seat 7,/ })).toHaveAttribute('aria-pressed', 'false')
    await user.click(screen.getByRole('button', { name: /seat 9,/ }))
    expect(screen.getByText('6 seats selected')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /seat 1,/ }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows Event not found for an unknown id', async () => {
    renderEvent('nope')
    expect(await screen.findByRole('heading', { name: 'Event not found' })).toBeInTheDocument()
  })

  it('shows an error with retry when seats fail to load', async () => {
    vi.spyOn(seatsApi, 'getEventSeats').mockRejectedValueOnce(new Error('x'))
    const user = userEvent.setup()
    renderEvent('e1')
    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load the seats")
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('button', { name: /seat 1,/ })).toBeInTheDocument()
  })
})

describe('useSeatSelection', () => {
  it('respects max and clears the limit flag on deselect', () => {
    const { result } = renderHook(() => useSeatSelection(2))
    act(() => result.current.toggle('a'))
    act(() => result.current.toggle('b'))
    act(() => result.current.toggle('c'))
    expect(result.current.selected).toEqual(['a', 'b'])
    expect(result.current.limitReached).toBe(true)
    act(() => result.current.toggle('a'))
    expect(result.current.limitReached).toBe(false)
  })
})
