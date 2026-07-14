/*
  Acuity scoring. This is the product argument in code, so it is written to be read.

  Four levels, sorted by time to harm rather than severity alone:
    stable  nothing needs a human
    watch   worth a glance, harm is weeks out
    acute   needs a human today
    critical  harm is landing now

  How a score is built:
   1. Each vital produces a load in 0..1. Deterioration against the project's own
      baseline dominates (0.72). Absolute out of band badness is capped context (0.28),
      so a chronically poor but steady vital cannot on its own raise the alarm.
   2. Loads are combined with weights. Pulse is weighted highest because silence is
      the earliest warning that a project is dying.
   3. Two or more vitals failing at once adds a breadth bump. Co-occurring problems
      are worse than one.
   4. The score buckets into the four levels.

  Chronic is tracked separately: high absolute burden with low deterioration. It shows
  a marker, it does not raise acuity. A project too new for a baseline returns
  'insufficient' and is never given a fake score.
*/

import type { Project, VitalKind, VitalSeries } from './types.ts'
import { VITAL_ORDER } from './types.ts'
import { clamp01, outOfBandFraction } from './vitals.ts'
import { BASELINE_MIN_DAYS, deteriorationFraction, isChronicVital } from './baseline.ts'

export type Acuity = 'stable' | 'watch' | 'acute' | 'critical'
export type AcuityOrInsufficient = Acuity | 'insufficient'

const WEIGHTS: Record<VitalKind, number> = {
  pulse: 0.34, // lead indicator, silence is the earliest warning
  pressure: 0.24,
  respiration: 0.22,
  temperature: 0.2,
}

// bucket edges on the 0..1 deterioration weighted score
const WATCH_MIN = 0.1
const ACUTE_MIN = 0.28
const CRITICAL_MIN = 0.52

export interface Assessment {
  acuity: AcuityOrInsufficient
  /** 0..1, deterioration weighted. Drives the level. */
  score: number
  /** 0..1, absolute out of band burden. Context, not alarm. */
  chronicBurden: number
  /** Poor but steady. Shows the chronic marker, does not raise acuity. */
  chronic: boolean
  insufficient: boolean
  /** Days until the soonest gated harm. Lower sorts first within a level. */
  timeToHarmDays: number
  /** Vitals ordered by how much they explain this reading, worst first. */
  drivers: VitalKind[]
}

/** Per vital contribution: deterioration dominates, absolute badness is capped context. */
export const vitalLoad = (v: VitalSeries): number =>
  clamp01(0.72 * deteriorationFraction(v) + 0.24 * Math.min(outOfBandFraction(v), 0.6))

const bucket = (score: number): Acuity => {
  if (score >= CRITICAL_MIN) return 'critical'
  if (score >= ACUTE_MIN) return 'acute'
  if (score >= WATCH_MIN) return 'watch'
  return 'stable'
}

const timeToHarm = (p: Project): number => {
  if (p.gate) return p.gate.daysAway
  const gating = p.milestones.filter((m) => m.gating && m.state !== 'delivered')
  if (gating.length) return Math.min(...gating.map((m) => m.dueInDays))
  const upcoming = p.milestones.filter((m) => m.state === 'current' || m.state === 'upcoming')
  if (upcoming.length) return Math.min(...upcoming.map((m) => m.dueInDays))
  return 999
}

export const assess = (p: Project): Assessment => {
  const vitals = VITAL_ORDER.map((k) => p.vitals[k])

  // drivers: most relevant vital first, blending deterioration and absolute badness
  const relevance = (v: VitalSeries) => Math.max(vitalLoad(v), outOfBandFraction(v) * 0.5)
  const drivers = [...VITAL_ORDER].sort((a, b) => relevance(p.vitals[b]) - relevance(p.vitals[a]))

  const chronicBurden = clamp01(
    vitals.reduce((sum, v) => sum + WEIGHTS[v.kind] * outOfBandFraction(v), 0),
  )

  // Too new to have an own baseline. Never fake a score.
  if (p.ageDays < BASELINE_MIN_DAYS) {
    return {
      acuity: 'insufficient',
      score: 0,
      chronicBurden,
      chronic: false,
      insufficient: true,
      timeToHarmDays: timeToHarm(p),
      drivers,
    }
  }

  const base = vitals.reduce((sum, v) => sum + WEIGHTS[v.kind] * vitalLoad(v), 0)
  // co-occurring problems are worse than one bad vital
  const acuteCount = vitals.filter((v) => vitalLoad(v) >= 0.5).length
  const breadth = acuteCount >= 2 ? 0.08 * (acuteCount - 1) : 0
  const score = clamp01(base + breadth)

  const chronic = score < ACUTE_MIN && chronicBurden >= 0.32 && vitals.some(isChronicVital)

  return {
    acuity: bucket(score),
    score,
    chronicBurden,
    chronic,
    insufficient: false,
    timeToHarmDays: timeToHarm(p),
    drivers,
  }
}

const ACUITY_RANK: Record<AcuityOrInsufficient, number> = {
  critical: 4,
  acute: 3,
  watch: 2,
  stable: 1,
  insufficient: 0,
}

export const acuityRank = (a: AcuityOrInsufficient): number => ACUITY_RANK[a]

export const isAlarming = (a: AcuityOrInsufficient): boolean => a === 'acute' || a === 'critical'

/** Ledger order: acuity first, then how soon the harm lands. */
export const compareAssessments = (a: Assessment, b: Assessment): number => {
  const r = ACUITY_RANK[b.acuity] - ACUITY_RANK[a.acuity]
  if (r !== 0) return r
  return a.timeToHarmDays - b.timeToHarmDays
}
