/*
  The four signals a producer watches, each reduced to a concern in 0..1 (higher is more
  worrying) with three reads: now, the client's baseline (how they normally run), and a
  week ago (for the trend). Everything is derived from the raw event, and each signal
  carries the facts behind it so a written line can always cite a real number.
*/

import type { EventRecord, SignalKind, Vendor } from './types.ts'

export const clamp01 = (n: number): number => Math.min(1, Math.max(0, n))
const round = (n: number): number => Math.round(n)

/** Time gone from kickoff to show day, 0 to 1. Past show day reads as fully elapsed. */
export const elapsedFraction = (e: EventRecord): number => {
  const span = e.showDaysFromToday - e.kickoffDaysFromToday
  if (span <= 0) return 1
  return clamp01((0 - e.kickoffDaysFromToday) / span)
}

const elapsedFractionWeekAgo = (e: EventRecord): number => {
  const span = e.showDaysFromToday - e.kickoffDaysFromToday
  if (span <= 0) return 1
  return clamp01((-7 - e.kickoffDaysFromToday) / span)
}

/** How much being behind bites, given how little time is left. Same gap far out is calm. */
const urgency = (daysLeft: number): number => (daysLeft <= 0 ? 1 : 1 + clamp01((45 - daysLeft) / 45) * 2.5)

/** Behind the clock, amplified as the date closes in. The readiness gap is the trouble. */
export const readinessGap = (e: EventRecord): number => Math.max(0, elapsedFraction(e) - e.readiness)

const pendingNearLock = (vendors: Vendor[]): number =>
  vendors.filter((v) => !v.contracted && v.lockDaysFromToday <= 10).length

export interface Signal {
  kind: SignalKind
  now: number
  baseline: number
  lastWeek: number
  facts: { label: string; value: string }[]
}

function readinessSignal(e: EventRecord): Signal {
  const daysLeft = Math.max(0, e.showDaysFromToday)
  const urg = urgency(daysLeft)
  const now = clamp01(readinessGap(e) * urg)
  const baseline = clamp01(e.normal.readinessGap * urg)
  const gapLW = Math.max(0, elapsedFractionWeekAgo(e) - e.readinessLastWeek)
  const lastWeek = clamp01(gapLW * urgency(daysLeft + 7))
  return {
    kind: 'readiness',
    now,
    baseline,
    lastWeek,
    facts: [
      { label: 'locked', value: `${round(e.readiness * 100)}%` },
      { label: 'time gone', value: `${round(elapsedFraction(e) * 100)}%` },
      { label: 'days to show', value: `${daysLeft}` },
    ],
  }
}

function waitingSignal(e: EventRecord): Signal {
  const silence = (d: number) => clamp01(d / 14)
  const pending = pendingNearLock(e.vendors)
  const vendorConcern = clamp01(pending / 3)
  const now = clamp01(0.6 * silence(e.clientReplyDays) + 0.4 * vendorConcern)
  const baseline = clamp01(0.6 * silence(e.normal.clientReplyDays))
  const lastWeek = clamp01(0.6 * silence(e.clientReplyDaysLastWeek) + 0.4 * vendorConcern)
  const facts = [{ label: 'client quiet', value: `${e.clientReplyDays} days` }]
  if (pending > 0) facts.push({ label: 'unconfirmed near lock', value: `${pending}` })
  return { kind: 'waiting', now, baseline, lastWeek, facts }
}

function budgetSignal(e: EventRecord): Signal {
  const concern = (committed: number) => clamp01((committed / e.budget.cap - 0.8) / 0.2)
  const now = concern(e.budget.committed)
  const baseline = clamp01((e.normal.committedFraction - 0.8) / 0.2)
  const lastWeek = concern(e.committedLastWeek)
  const committedPct = round((e.budget.committed / e.budget.cap) * 100)
  const unspent = e.budget.committed - e.budget.spent
  return {
    kind: 'budget',
    now,
    baseline,
    lastWeek,
    facts: [
      { label: 'committed', value: `${committedPct}% of cap` },
      { label: 'committed but unspent', value: `$${Math.round(unspent / 1000)}k` },
    ],
  }
}

function crewSignal(e: EventRecord): Signal {
  const stretchConcern = (s: number) => clamp01((s - 1) / 0.4)
  const peak = e.crew.reduce((m, c) => Math.max(m, c.stretch), 0)
  const collisions = e.crew.filter((c) => c.collidesWith)
  const now = clamp01(Math.max(stretchConcern(peak), collisions.length > 0 ? 0.7 : 0))
  const baseline = clamp01(stretchConcern(e.normal.crewStretch))
  const lastWeek = clamp01(Math.max(stretchConcern(e.crewStretchLastWeek), collisions.length > 0 ? 0.7 : 0))
  const facts = [{ label: 'peak stretch', value: `${round(peak * 100)}%` }]
  if (collisions.length) {
    facts.push({ label: 'double booked', value: `${collisions[0].name} with ${collisions[0].collidesWith}` })
  }
  return { kind: 'crew', now, baseline, lastWeek, facts }
}

export const signalsFor = (e: EventRecord): Record<SignalKind, Signal> => ({
  readiness: readinessSignal(e),
  waiting: waitingSignal(e),
  budget: budgetSignal(e),
  crew: crewSignal(e),
})
