/*
  Derived reads over a single vital series. Nothing here is stored on the data;
  it is all computed from history, band, and axis, so a reviewer can trace every
  number on screen back to the series that produced it.
*/

import type { VitalSeries } from './types.ts'

export const clamp01 = (n: number): number => Math.min(1, Math.max(0, n))

/** Current reading. The newest day in the series. */
export const current = (v: VitalSeries): number => v.history[v.history.length - 1] ?? 0

/** Reading one week ago, used for the week over week delta. */
export const weekAgo = (v: VitalSeries): number => {
  const h = v.history
  if (h.length === 0) return 0
  const idx = h.length - 8
  return idx >= 0 ? h[idx] : h[0]
}

/** Change since last week. Positive means the vital got worse. */
export const weekDelta = (v: VitalSeries): number => current(v) - weekAgo(v)

export type BandStatus = 'in' | 'high' | 'low'

export const bandStatus = (v: VitalSeries): BandStatus => {
  const value = current(v)
  if (value > v.band[1]) return 'high'
  if (value < v.band[0]) return 'low'
  return 'in'
}

export const inBand = (v: VitalSeries): boolean => bandStatus(v) === 'in'

/**
 * How far past the upper edge of normal, as a fraction of the room between the
 * edge and the axis ceiling. 0 while in band, approaching 1 at the far edge.
 * This is absolute badness, the "how bad is it right now" signal.
 */
export const outOfBandFraction = (v: VitalSeries): number => {
  const value = current(v)
  const upper = v.band[1]
  if (value <= upper) return 0
  const room = Math.max(1, v.axisMax - upper)
  return clamp01((value - upper) / room)
}

export type TrendDirection = 'rising' | 'falling' | 'flat'

/**
 * Direction of the last week, expressed as clinical trend. Rising means the value
 * is climbing, which for these vitals means getting worse. The threshold keeps
 * small wobbles from reading as a trend.
 */
export const trendDirection = (v: VitalSeries): TrendDirection => {
  const delta = weekDelta(v)
  const noise = Math.max(0.75, (v.band[1] - v.band[0]) * 0.12)
  if (delta > noise) return 'rising'
  if (delta < -noise) return 'falling'
  return 'flat'
}

/** Position of the current reading on the axis, 0 to 1, for the reading track. */
export const readingPosition = (v: VitalSeries): number => clamp01(current(v) / v.axisMax)

/** Band edges as fractions of the axis, for shading the normal range. */
export const bandExtent = (v: VitalSeries): [number, number] => [
  clamp01(v.band[0] / v.axisMax),
  clamp01(v.band[1] / v.axisMax),
]

/** Trend series as axis fractions, for the sparkline. */
export const trendPoints = (v: VitalSeries): number[] =>
  v.history.map((d) => clamp01(d / v.axisMax))
