// Hand-written only while the API is mocked (issue #3). Replace with types generated from
// openapi.yaml once the real API client lands.
export interface EventSummary {
  id: string
  name: string
  /** ISO 8601 timestamp. */
  starts_at: string
  venue: { name: string; city: string }
  /** Integer paise (Q22). */
  min_price_cents: number
  max_price_cents: number
}

export type SeatStatus = 'available' | 'held' | 'sold'

// Hand-written for the mock seat map (issue #4); replaced by generated types later.
export interface Seat {
  id: string
  section: string
  row: string
  number: number
  /** Integer paise. */
  price_cents: number
  status: SeatStatus
}
