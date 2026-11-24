import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { getEvent } from '../api/events.ts'

// Placeholder: the seat map is issue #4.
export function EventPage() {
  const { id = '' } = useParams()
  const query = useQuery({ queryKey: ['events', id], queryFn: () => getEvent(id) })

  return (
    <section>
      <Link to="/" className="text-sm text-slate-600 underline">
        Back to events
      </Link>
      {query.isPending ? (
        <p className="mt-4 text-slate-600">Loading event…</p>
      ) : query.isError ? (
        <p role="alert" className="mt-4 text-red-800">
          We couldn't load this event.
        </p>
      ) : (
        <>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            {query.data?.name ?? 'Event not found'}
          </h1>
          <p className="mt-2 text-slate-600">Seat map coming soon</p>
        </>
      )}
    </section>
  )
}
