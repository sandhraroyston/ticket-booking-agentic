import type { EventSummary } from './types.ts'

const HOUR = 3_600_000
const DAY = 24 * HOUR

function mockEvents(now: number): EventSummary[] {
  const at = (ms: number) => new Date(now + ms).toISOString()
  const hall = { name: 'Jubilee Hall', city: 'Mumbai' }
  const theatre = { name: 'Kalakshetra Theatre', city: 'Bengaluru' }
  return [
    { id: 'evt-5', name: 'Stand-up Saturday', starts_at: at(21 * DAY), venue: theatre, min_price_cents: 40000, max_price_cents: 40000 },
    { id: 'evt-1', name: 'Monsoon Jazz Night', starts_at: at(3 * DAY), venue: hall, min_price_cents: 50000, max_price_cents: 125000 },
    { id: 'evt-past', name: 'Last Month Recital', starts_at: at(-10 * DAY), venue: hall, min_price_cents: 30000, max_price_cents: 90000 },
    { id: 'evt-3', name: 'Classical Carnatic Evening', starts_at: at(10 * DAY), venue: theatre, min_price_cents: 60000, max_price_cents: 250000 },
    { id: 'evt-2', name: 'Indie Film Premiere', starts_at: at(7 * DAY + 2 * HOUR), venue: hall, min_price_cents: 35000, max_price_cents: 75000 },
  ]
}

/**
 * Mock data layer. The UI only depends on `listEvents` / `getEvent`, so swapping in the real
 * API later means changing this file only.
 *
 * Manual demo of the error state: open the app with `?mockError=1` in the URL
 * (e.g. http://localhost:5173/?mockError=1) and every call here rejects.
 */
async function simulate(): Promise<void> {
  // No artificial latency under test.
  if (import.meta.env.MODE !== 'test') {
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  if (new URLSearchParams(window.location.search).get('mockError') === '1') {
    throw new Error('Mock error requested via ?mockError=1')
  }
}

export async function listEvents(): Promise<EventSummary[]> {
  await simulate()
  return mockEvents(Date.now())
}

export async function getEvent(id: string): Promise<EventSummary | undefined> {
  await simulate()
  return mockEvents(Date.now()).find((e) => e.id === id)
}
