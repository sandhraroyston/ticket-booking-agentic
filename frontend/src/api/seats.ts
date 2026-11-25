import { getEvent } from './events.ts'
import type { Seat, SeatStatus } from './types.ts'

const SECTIONS = [
  { name: 'A', price_cents: 125000, rows: 3 },
  { name: 'B', price_cents: 75000, rows: 3 },
  { name: 'C', price_cents: 50000, rows: 2 },
]
const SEATS_PER_ROW = 10

/** Deterministic status so the mock looks the same on every load. */
function statusFor(index: number): SeatStatus {
  if (index % 7 === 3) return 'sold'
  if (index % 11 === 5) return 'held'
  return 'available'
}

export function generateSeats(): Seat[] {
  const seats: Seat[] = []
  let index = 0
  for (const section of SECTIONS) {
    for (let r = 1; r <= section.rows; r++) {
      for (let n = 1; n <= SEATS_PER_ROW; n++) {
        seats.push({
          id: `${section.name}-${r}-${n}`,
          section: section.name,
          row: String(r),
          number: n,
          price_cents: section.price_cents,
          status: statusFor(index++),
        })
      }
    }
  }
  return seats
}

/** Mock seats for an event. Rejects like the events mock does under `?mockError=1`. */
export async function getEventSeats(eventId: string): Promise<Seat[]> {
  const event = await getEvent(eventId)
  return event ? generateSeats() : []
}
