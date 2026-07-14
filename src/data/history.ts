/*
  Trend builders and the shared vital configuration.

  Histories are authored, not random, so the trends mean something and the acuity
  scores are reproducible. `trend(from, to)` holds at the project's own normal for the
  first week, then moves to the current reading over the second week. That makes the
  first seven days the baseline and the last day the current reading, which is exactly
  what baseline.ts and vitals.ts read.
*/

import type { VitalFact, VitalKind, VitalSeries } from '../domain/types.ts'

// Deterministic, gentle texture so lines look measured rather than ruler straight.
const TEXTURE = [0, 0.18, -0.12, 0.06, -0.16, 0.1, -0.04, 0.14, -0.1, 0.05, -0.14, 0.08, -0.06, 0]
const round1 = (n: number): number => Math.round(n * 10) / 10

interface TrendOpts {
  /** Day index where movement from `from` toward `to` begins. */
  pivot?: number
  /** Texture amount, scaled to the vital's units. */
  texture?: number
  /** Series length. 14 for an established project, fewer for a new one. */
  len?: number
}

export function trend(from: number, to: number, opts: TrendOpts = {}): number[] {
  const len = opts.len ?? 14
  const pivot = opts.pivot ?? 7
  const tex = opts.texture ?? 0.5
  const out: number[] = []
  for (let i = 0; i < len; i++) {
    let base: number
    if (i <= pivot) {
      base = from
    } else {
      const t = (i - pivot) / (len - 1 - pivot)
      base = from + (to - from) * t
    }
    const jitter = i === 0 || i === len - 1 ? 0 : TEXTURE[i % TEXTURE.length] * tex
    out.push(round1(Math.max(0, base + jitter)))
  }
  out[len - 1] = to // pin the current reading exactly
  return out
}

/** A vital that sits at one level all fortnight. Its baseline equals its reading. */
export const flat = (value: number, opts: TrendOpts = {}): number[] =>
  trend(value, value, opts)

interface VitalConfig {
  unit: string
  band: [number, number]
  axisMax: number
}

/*
  Bands and axes are shared across projects so a reading means the same thing
  everywhere. The upper band edge is the concern threshold.
*/
export const VITAL_CONFIG: Record<VitalKind, VitalConfig> = {
  pulse: { unit: 'd', band: [0, 3], axisMax: 14 }, // days since either side moved
  pressure: { unit: 'pts', band: [0, 10], axisMax: 40 }, // budget points ahead of scope
  temperature: { unit: 'req', band: [0, 3], axisMax: 12 }, // new requests in 14 days
  respiration: { unit: 'd', band: [0, 7], axisMax: 28 }, // age of the oldest open blocker
}

export function vital(kind: VitalKind, history: number[], facts: VitalFact[]): VitalSeries {
  return { kind, ...VITAL_CONFIG[kind], history, facts }
}
