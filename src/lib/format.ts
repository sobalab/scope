/** Small formatting helpers. Numbers stay specific; no vague language. */

export const signed = (n: number): string => {
  const r = Math.round(n * 10) / 10
  if (r === 0) return 'no change'
  return r > 0 ? `+${r}` : `${r}`
}

/** Human phrasing for a day offset from today. Negative means in the past. */
export const dayPhrase = (days: number): string => {
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days === -1) return 'yesterday'
  if (days < 0) return `${Math.abs(days)} days ago`
  return `in ${days} days`
}

export const percent = (n: number): string => `${Math.round(n)}%`
