import { useCallback, useState } from 'react'

export const MAX_SEATS_MESSAGE = 'You can hold up to 6 seats'

export function useSeatSelection(max = 6) {
  const [selected, setSelected] = useState<string[]>([])
  const [limitReached, setLimitReached] = useState(false)

  const toggle = useCallback(
    (id: string) => {
      if (selected.includes(id)) {
        setSelected(selected.filter((s) => s !== id))
        setLimitReached(false)
      } else if (selected.length >= max) {
        setLimitReached(true)
      } else {
        setSelected([...selected, id])
        setLimitReached(false)
      }
    },
    [selected, max],
  )

  return { selected, toggle, limitReached }
}
