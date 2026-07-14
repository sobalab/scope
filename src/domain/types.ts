/*
  The domain model for Vitals.

  Design rule that everything else follows: a vital is stored as a 14 day series of
  one oriented scalar, where a HIGHER value always means MORE concerning, in the
  vital's own native unit. That single rule lets one reading component, one severity
  function, and one acuity score work across all four vitals without special cases.

  Nothing in here stores an acuity string. Acuity is computed in acuity.ts from the
  series, so the argument is inspectable and cannot drift from the data.
*/

export type VitalKind = 'pulse' | 'pressure' | 'temperature' | 'respiration'

export const VITAL_ORDER: VitalKind[] = ['pulse', 'pressure', 'temperature', 'respiration']

/** A supporting signal shown next to any claim, so a number is always traceable. */
export interface VitalFact {
  label: string // 'client quiet'
  value: string // '9 days'
}

export interface VitalSeries {
  kind: VitalKind
  /** Short unit shown after the reading, e.g. 'd', 'pts', 'req'. */
  unit: string
  /**
   * Normal range in native units. The upper edge is the concern threshold.
   * Values above band[1] are out of range on the high side.
   */
  band: [number, number]
  /** Display ceiling for the reading scale, so the marker and band map to a track. */
  axisMax: number
  /** 14 daily values, oldest to newest, oriented so higher = worse. */
  history: number[]
  /** Raw signals behind this vital, rendered for traceability. */
  facts: VitalFact[]
}

export type MilestoneState = 'delivered' | 'current' | 'slipped' | 'upcoming'

export interface Milestone {
  id: string
  title: string
  /** Days from today. Negative means past due. */
  dueInDays: number
  state: MilestoneState
  /** True when this milestone holds up downstream work. */
  gating?: boolean
}

export interface Blocker {
  id: string
  title: string
  ageDays: number
  owner: string // 'Client, design sign off'
  state: 'open' | 'resolved'
}

export type ActivityKind = 'ship' | 'message' | 'request' | 'blocker' | 'milestone'

export interface ActivityEvent {
  id: string
  daysAgo: number
  kind: ActivityKind
  who: string
  text: string
}

export interface BudgetScope {
  hoursUsed: number
  hoursBudget: number
  /** Percent of contracted scope delivered, 0 to 100. */
  scopeDelivered: number
}

/** The single soonest thing that gates other work. Drives time to harm. */
export interface Gate {
  label: string // 'Design review'
  daysAway: number // 3
  blocks: string // 'dev on the member dashboard'
}

export interface Project {
  id: string
  client: string // 'Hartwell'
  engagement: string // 'Member portal rebuild'
  lead: string // studio owner on the account
  /** Days since kickoff. Below BASELINE_MIN_DAYS there is no baseline yet. */
  ageDays: number
  /** Seeds the snoozed state. Keystone ships snoozed because the lead is already on it. */
  initiallySnoozed?: boolean
  vitals: Record<VitalKind, VitalSeries>
  budget: BudgetScope
  milestones: Milestone[]
  blockers: Blocker[]
  activity: ActivityEvent[]
  gate?: Gate
}
