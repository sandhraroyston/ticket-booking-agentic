import { formatPrice } from '../api/format.ts'
import type { Seat, SeatStatus } from '../api/types.ts'
import { MAX_SEATS_MESSAGE, useSeatSelection } from './useSeatSelection.ts'

const STYLES: Record<SeatStatus, string> = {
  available: 'border-green-700 bg-green-100 text-green-900 hover:bg-green-200',
  held: 'cursor-not-allowed border-dashed border-amber-700 bg-amber-100 text-amber-900',
  sold: 'cursor-not-allowed border-slate-500 bg-slate-300 text-slate-600 line-through',
}
const ICON: Record<SeatStatus, string> = { available: '', held: '⏳', sold: '✕' }
const SELECTED_STYLE = 'border-blue-800 bg-blue-700 text-white ring-2 ring-blue-400'

function groupSeats(seats: Seat[]) {
  const sections = new Map<string, Map<string, Seat[]>>()
  for (const s of seats) {
    const rows = sections.get(s.section) ?? new Map<string, Seat[]>()
    rows.set(s.row, [...(rows.get(s.row) ?? []), s])
    sections.set(s.section, rows)
  }
  return sections
}

export function SeatMap({ seats }: { seats: Seat[] }) {
  const { selected, toggle, limitReached } = useSeatSelection(6)
  const total = seats.filter((s) => selected.includes(s.id)).reduce((n, s) => n + s.price_cents, 0)

  return (
    <div className="mt-6">
      <ul aria-label="Legend" className="flex flex-wrap gap-4 text-sm">
        <li className="flex items-center gap-1">
          <span aria-hidden className={`inline-block size-5 rounded border ${STYLES.available}`} />
          Available
        </li>
        <li className="flex items-center gap-1">
          <span aria-hidden className={`inline-block size-5 rounded border text-center text-xs ${SELECTED_STYLE}`} />
          Selected
        </li>
        <li className="flex items-center gap-1">
          <span aria-hidden className={`inline-block size-5 rounded border text-center text-xs ${STYLES.held}`}>
            {ICON.held}
          </span>
          Held
        </li>
        <li className="flex items-center gap-1">
          <span aria-hidden className={`inline-block size-5 rounded border text-center text-xs ${STYLES.sold}`}>
            {ICON.sold}
          </span>
          Sold
        </li>
      </ul>

      {[...groupSeats(seats)].map(([section, rows]) => (
        <section key={section} aria-label={`Section ${section}`} className="mt-6">
          <h2 className="text-lg font-semibold">Section {section}</h2>
          {[...rows].map(([row, rowSeats]) => (
            <div key={row} className="mt-2 flex items-center gap-2">
              <span className="w-14 text-sm text-slate-600">Row {row}</span>
              <div className="flex flex-wrap gap-1">
                {rowSeats.map((seat) => {
                  const isSelected = selected.includes(seat.id)
                  const unavailable = seat.status !== 'available'
                  return (
                    <button
                      key={seat.id}
                      type="button"
                      disabled={unavailable}
                      aria-pressed={unavailable ? undefined : isSelected}
                      aria-label={`Section ${seat.section}, row ${seat.row}, seat ${seat.number}, ${formatPrice(seat.price_cents)}, ${isSelected ? 'selected' : seat.status}`}
                      onClick={() => toggle(seat.id)}
                      className={`size-9 rounded border text-xs font-medium ${isSelected ? SELECTED_STYLE : STYLES[seat.status]}`}
                    >
                      {ICON[seat.status] || seat.number}
                      {unavailable && <span className="sr-only">{seat.number}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </section>
      ))}

      <div className="mt-6 rounded-md border border-slate-200 bg-white p-4" aria-live="polite">
        <p>
          {selected.length} {selected.length === 1 ? 'seat' : 'seats'} selected
        </p>
        <p className="font-semibold">Total: {formatPrice(total)}</p>
        {limitReached && (
          <p role="alert" className="mt-2 text-red-800">
            {MAX_SEATS_MESSAGE}
          </p>
        )}
      </div>
    </div>
  )
}
