/*
  Calendar helpers. The data stores day offsets from today; these turn an offset into a
  real date label so the board reads like a producer's calendar, not an abstraction.
*/

const TODAY = new Date(2026, 6, 14) // the demo's fixed today

export const dateForOffset = (days: number): Date => {
  const d = new Date(TODAY)
  d.setDate(d.getDate() + days)
  return d
}

export const dateLabel = (days: number): string =>
  dateForOffset(days).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export const dayPhrase = (days: number): string => {
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days === -1) return 'yesterday'
  if (days < 0) return `${Math.abs(days)} days ago`
  return `in ${days} days`
}
