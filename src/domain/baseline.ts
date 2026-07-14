/*
  Baseline and the acute versus chronic distinction, the most important idea in the
  product. Every vital is judged against the project's OWN normal, not a global one.

  A project that is objectively poor but sitting where it always sits is chronic.
  Alarming the lead about it every morning is how a dashboard trains people to ignore
  it. Deterioration against its own baseline is the signal. Absolute value is context.
*/

import type { VitalSeries } from './types.ts'
import { clamp01, current, outOfBandFraction } from './vitals.ts'

/** Fewer than this many days of history means no trustworthy baseline yet. */
export const BASELINE_MIN_DAYS = 14

const median = (xs: number[]): number => {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid]
}

/**
 * The project's own normal for this vital: where it usually sat before this week.
 * Median of every day except the last seven, so a chronically slow account reads a
 * high baseline and a suddenly slow account reads a low one.
 */
export const baseline = (v: VitalSeries): number => {
  const older = v.history.slice(0, Math.max(1, v.history.length - 7))
  return median(older)
}

/**
 * Adverse movement away from the project's own baseline, normalized by band width so
 * a full band of drift reads near 1. Only worsening counts; recovering reads 0.
 * This is what drives acuity up.
 */
export const deteriorationFraction = (v: VitalSeries): number => {
  const drift = current(v) - baseline(v)
  if (drift <= 0) return 0
  const bandWidth = Math.max(1, v.band[1] - v.band[0])
  return clamp01(drift / (bandWidth * 2))
}

/** True when a vital is poor but steady: well out of band, yet not deteriorating. */
export const isChronicVital = (v: VitalSeries): boolean =>
  outOfBandFraction(v) >= 0.3 && deteriorationFraction(v) < 0.18
