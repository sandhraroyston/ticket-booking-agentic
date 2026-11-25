import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { getEvent } from '../api/events.ts'
import { formatDateTime } from '../api/format.ts'
import { getEventSeats } from '../api/seats.ts'
import { SeatMap } from './SeatMap.tsx'

export function EventPage() {
  const { id = '' } = useParams()
  const query = useQuery({ queryKey: ['events', id], queryFn: async () => (await getEvent(id)) ?? null })
  const event = query.data
  const seatsQuery = useQuery({
    queryKey: ['events', id, 'seats'],
    queryFn: () => getEventSeats(id),
    enabled: !!event,
  })

  return (
    <section>
      <Link to="/" className="text-sm text-slate-600 underline">
        Back to events
      </Link>
      {query.isPending ? (
        <p className="mt-4 text-slate-600">Loading event…</p>
      ) : query.isError ? (
        <Failure message="We couldn't load this event." onRetry={() => void query.refetch()} />
      ) : !event ? (
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Event not found</h1>
      ) : (
        <>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">{event.name}</h1>
          <p className="mt-2 text-slate-600">
            {event.venue.name}, {event.venue.city} · {formatDateTime(event.starts_at)}
          </p>
          {seatsQuery.isPending ? (
            <p className="mt-6 text-slate-600">Loading seats…</p>
          ) : seatsQuery.isError ? (
            <Failure message="We couldn't load the seats." onRetry={() => void seatsQuery.refetch()} />
          ) : (
            <SeatMap seats={seatsQuery.data} />
          )}
        </>
      )}
    </section>
  )
}

function Failure({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
      <p>{message} Please try again.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded bg-red-700 px-3 py-1.5 text-white hover:bg-red-800"
      >
        Retry
      </button>
    </div>
  )
}
