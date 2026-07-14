import type { VitalKind, VitalSeries } from '../../domain/types.ts'
import { bandStatus, outOfBandFraction } from '../../domain/vitals.ts'

interface VitalMeta {
  label: string
  /** The clinical system it stands in for, shown quietly. */
  system: string
  /** What the number measures, plain language, for the hover reveal. */
  measures: string
}

export const VITAL_META: Record<VitalKind, VitalMeta> = {
  pulse: { label: 'Pulse', system: 'momentum', measures: 'days since either side last moved' },
  pressure: { label: 'Pressure', system: 'budget vs scope', measures: 'budget points spent ahead of scope' },
  temperature: { label: 'Temperature', system: 'scope volatility', measures: 'new requests added in 14 days' },
  respiration: { label: 'Respiration', system: 'blocker flow', measures: 'age of the oldest open blocker' },
}

/*
  A vital reads neutral ink while it sits in its normal band. It only takes on color
  once it leaves the band, and the color deepens with distance. Keeping in-band vitals
  monochrome is what stops the reading from becoming a wall of green and red.
*/
export const vitalTone = (v: VitalSeries): string => {
  if (bandStatus(v) === 'in') return 'var(--color-ink)'
  return outOfBandFraction(v) < 0.4 ? 'var(--color-ochre)' : 'var(--color-rust)'
}
