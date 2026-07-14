import type { VitalKind } from '../domain/types.ts'

interface VitalMeta {
  label: string
  /** The clinical system it stands in for, shown quietly. */
  system: string
  /** What the number measures, in plain language. */
  measures: string
}

export const VITAL_META: Record<VitalKind, VitalMeta> = {
  pulse: { label: 'Pulse', system: 'momentum', measures: 'days since either side last moved' },
  pressure: { label: 'Pressure', system: 'budget vs scope', measures: 'budget points spent ahead of scope' },
  temperature: { label: 'Temperature', system: 'scope volatility', measures: 'new requests added in 14 days' },
  respiration: { label: 'Respiration', system: 'blocker flow', measures: 'age of the oldest open blocker' },
}
