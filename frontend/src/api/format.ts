const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
const dateTime = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

/** Formats integer paise as INR, e.g. 125000 -> "₹1,250.00". */
export function formatPrice(cents: number): string {
  return inr.format(cents / 100)
}

/** "₹500.00 – ₹1,250.00", or a single price when min equals max. */
export function formatPriceRange(minCents: number, maxCents: number): string {
  return minCents === maxCents
    ? formatPrice(minCents)
    : `${formatPrice(minCents)} – ${formatPrice(maxCents)}`
}

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso))
}
