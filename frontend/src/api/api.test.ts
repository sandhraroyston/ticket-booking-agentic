import { describe, expect, it } from 'vitest'
import { formatPrice, formatPriceRange } from './format.ts'
import type { EventSummary } from './types.ts'
import { upcomingEvents } from './upcomingEvents.ts'

const e = (id: string, iso: string): EventSummary => ({
  id,
  name: id,
  starts_at: iso,
  venue: { name: 'V', city: 'C' },
  min_price_cents: 1,
  max_price_cents: 2,
})

describe('upcomingEvents', () => {
  it('filters past events and sorts ascending without relying on input order', () => {
    const now = Date.parse('2030-01-10T00:00:00Z')
    const result = upcomingEvents(
      [e('late', '2030-02-01T00:00:00Z'), e('past', '2030-01-01T00:00:00Z'), e('soon', '2030-01-11T00:00:00Z')],
      now,
    )
    expect(result.map((x) => x.id)).toEqual(['soon', 'late'])
  })
})

describe('price formatting', () => {
  it('formats paise as INR', () => {
    expect(formatPrice(125000)).toBe('₹1,250.00')
  })
  it('collapses equal min and max', () => {
    expect(formatPriceRange(40000, 40000)).toBe('₹400.00')
    expect(formatPriceRange(50000, 125000)).toBe('₹500.00 – ₹1,250.00')
  })
})
