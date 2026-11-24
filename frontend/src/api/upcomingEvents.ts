import type { EventSummary } from './types.ts'

/** Drops events that already started and sorts the rest by `starts_at` ascending. */
export function upcomingEvents(events: EventSummary[], now: number = Date.now()): EventSummary[] {
  return events
    .filter((e) => new Date(e.starts_at).getTime() > now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
}
