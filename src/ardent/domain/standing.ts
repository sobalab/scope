/*
  Standing, worked out from the four signals. This is the heart of the product, so it is
  written to be read.

  The rule that makes it useful: what MOVED is the signal, where it SITS is the context.
  Each signal's contribution is driven by how far it pulled away from this client's own
  baseline and how much it worsened this week. Absolute position is capped context, so a
  client who is behind exactly as they always are stays quiet on the board while a client
  who slipped this week jumps to the top.

  Readiness is weighted highest, because being behind against a fixed date is the trouble.
  Urgency already lives inside each signal (a gap far out is calm, the same gap close in is
  the fire), so the score needs no separate time term.
*/

import type { EventRecord, SignalKind } from './types.ts'
import { SIGNAL_ORDER } from './types.ts'
import type { Signal } from './signals.ts'
import { clamp01, signalsFor } from './signals.ts'

export type Standing = 'onTrack' | 'watch' | 'behind' | 'atRisk'
export type StandingOrState = Standing | 'tooNew'

const WEIGHTS: Record<SignalKind, number> = { readiness: 0.4, waiting: 0.3, budget: 0.15, crew: 0.15 }

const WATCH_MIN = 0.1
const BEHIND_MIN = 0.3
const ATRISK_MIN = 0.52

/*
  How far this signal pulled away from the client's own baseline drives the load; absolute
  position is capped context. A client behind exactly as they always are matches their
  baseline, so it barely loads and stays quiet; a client that slipped is now worse than
  their baseline, so it loads and rises. The weekly trend is kept on the signal for the
  display arrow, deliberately out of the score so time passing is not mistaken for slipping.
*/
const load = (s: Signal): number =>
  clamp01(0.7 * Math.max(0, s.now - s.baseline) + 0.3 * Math.min(s.now, 0.6))

const bucket = (score: number): Standing => {
  if (score >= ATRISK_MIN) return 'atRisk'
  if (score >= BEHIND_MIN) return 'behind'
  if (score >= WATCH_MIN) return 'watch'
  return 'onTrack'
}

/** The soonest thing that bites: a missed lock bites now, otherwise the next lock or show day. */
const biteInDays = (e: EventRecord): number => {
  const openLocks = e.locks.filter((l) => !l.locked).map((l) => l.daysFromToday)
  return Math.min(e.showDaysFromToday, ...(openLocks.length ? openLocks : [Number.POSITIVE_INFINITY]))
}

export interface Assessment {
  standing: StandingOrState
  score: number
  behindButNormal: boolean
  tooNew: boolean
  missedLock: boolean
  biteInDays: number
  drivers: SignalKind[]
}

export const assess = (e: EventRecord): Assessment => {
  const signals = signalsFor(e)
  const drivers = [...SIGNAL_ORDER].sort((a, b) => load(signals[b]) - load(signals[a]))
  const missedLock = e.locks.some((l) => l.daysFromToday < 0 && !l.locked)

  // Too new to read: far out with almost nothing logged and no locks closed yet.
  const tooNew = e.showDaysFromToday > 120 && e.readiness < 0.12 && e.locks.every((l) => !l.locked)

  const base = SIGNAL_ORDER.reduce((sum, k) => sum + WEIGHTS[k] * load(signals[k]), 0)
  const hot = SIGNAL_ORDER.filter((k) => load(signals[k]) >= 0.5).length
  const breadth = hot >= 2 ? 0.06 * (hot - 1) : 0
  // A missed lock is loud on its own.
  const score = clamp01(base + breadth + (missedLock ? 0.14 : 0))

  const standing: StandingOrState = tooNew ? 'tooNew' : bucket(score)

  // Genuinely elevated on some signal, but nothing pulled away from the client's baseline.
  const anyElevated = SIGNAL_ORDER.some((k) => signals[k].now >= 0.35)
  const nothingAbnormal = SIGNAL_ORDER.every((k) => signals[k].now - signals[k].baseline < 0.1)
  const behindButNormal = !tooNew && !e.phase && anyElevated && nothingAbnormal && standing !== 'atRisk'

  return { standing, score, behindButNormal, tooNew, missedLock, biteInDays: biteInDays(e), drivers }
}

const RANK: Record<StandingOrState, number> = { atRisk: 4, behind: 3, watch: 2, onTrack: 1, tooNew: 0 }

export const standingRank = (s: StandingOrState): number => RANK[s]

export const isChaseable = (s: StandingOrState): boolean => s === 'atRisk' || s === 'behind'

/** Board order: standing first, then how soon it bites. */
export const compareAssessments = (a: Assessment, b: Assessment): number => {
  const r = RANK[b.standing] - RANK[a.standing]
  if (r !== 0) return r
  return a.biteInDays - b.biteInDays
}
