import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { Link } from 'react-router'
import { listEvents } from '../api/events.ts'
import { formatDateTime, formatPriceRange } from '../api/format.ts'
import type { EventSummary } from '../api/types.ts'
import { upcomingEvents } from '../api/upcomingEvents.ts'

export function HomePage() {
  const query = useQuery({ queryKey: ['events'], queryFn: listEvents })

  return (
    <section>
      <h1 className="text-3xl font-bold tracking-tight">Upcoming events</h1>
      <div className="mt-6">
        <EventsBody query={query} />
      </div>
    </section>
  )
}

function EventsBody({ query }: { query: UseQueryResult<EventSummary[]> }) {
  if (query.isPending) {
    return <p className="text-slate-600">Loading events…</p>
  }
  if (query.isError) {
    return (
      <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
        <p>We couldn't load events. Please try again.</p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="mt-3 rounded bg-red-700 px-3 py-1.5 text-white hover:bg-red-800"
        >
          Retry
        </button>
      </div>
    )
  }
  const events = upcomingEvents(query.data)
  if (events.length === 0) {
    return <p className="text-slate-600">No upcoming events</p>
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {events.map((e) => (
        <li key={e.id}>
          <Link
            to={`/events/${e.id}`}
            className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-400"
          >
            <h2 className="text-lg font-semibold">{e.name}</h2>
            <p className="text-slate-600">
              {e.venue.name}, {e.venue.city}
            </p>
            <p className="mt-2 text-sm">{formatDateTime(e.starts_at)}</p>
            <p className="text-sm font-medium">
              {formatPriceRange(e.min_price_cents, e.max_price_cents)}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  )
}
