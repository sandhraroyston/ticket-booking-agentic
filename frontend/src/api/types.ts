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
