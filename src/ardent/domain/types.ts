/*
  Ardent domain model.

  The whole product runs on one truth: the date does not move. So an event's standing is
  read from how ready it is against how little time is left, not from elapsed time. Dates
  are stored as day offsets from today (0 = today, positive = future, negative = past), so
  the six events stay coherent without wall-clock math.

  Nothing here stores a standing string. Standing is computed in standing.ts from the four
  signals, so the logic that decides "this one is behind" is inspectable and cannot drift.
*/

export type EventType = 'gala' | 'popup' | 'launch' | 'conference' | 'dinner' | 'offsite'

export type SignalKind = 'readiness' | 'waiting' | 'budget' | 'crew'
export const SIGNAL_ORDER: SignalKind[] = ['readiness', 'waiting', 'budget', 'crew']

/** A lock date is a real deadline before the show: headcount, menu, floor plan, permits. */
export interface LockDate {
  id: string
  label: string
  owner: string
  daysFromToday: number
  locked: boolean
  breaksIf: string
}

export interface Vendor {
  id: string
  name: string
  role: string
  contracted: boolean // solid when true, dashed when pending
  depositPaid: boolean
  lockDaysFromToday: number
}

export interface CrewMember {
  name: string
  role: string
  /** Allocation on this event, 0 to about 1.4. Above 1 is overstretched. */
  stretch: number
  /** Set when this person is double booked on another event over the same dates. */
  collidesWith?: string
}

export interface OpenItem {
  id: string
  kind: 'blocker' | 'risk' | 'question'
  title: string
  ageDays: number
  owner: string
  onClient: boolean
}

export interface Activity {
  id: string
  daysAgo: number
  who: string
  channel: 'vendor' | 'client' | 'team' | 'system'
  text: string
}

export interface Budget {
  cap: number
  committed: number
  spent: number
}

/**
 * How this client normally runs, per signal. This is the baseline for new versus normal:
 * a signal that matches its baseline is behind as usual and stays quiet on the board; a
 * signal that pulled away from its baseline this week is what needs a producer.
 */
export interface ClientNormal {
  readinessGap: number // usual elapsed minus readiness gap, 0 to 1
  clientReplyDays: number // this client usually goes quiet this many days
  committedFraction: number // usual committed against cap
  crewStretch: number // usual peak stretch
}

export interface EventRecord {
  id: string
  client: string
  name: string
  type: EventType
  guests?: number

  kickoffDaysFromToday: number
  showDaysFromToday: number

  /** Production locked, 0 to 1, now and a week ago, for the readiness signal and its trend. */
  readiness: number
  readinessLastWeek: number

  clientReplyDays: number
  clientReplyDaysLastWeek: number

  budget: Budget
  committedLastWeek: number

  crew: CrewMember[]
  crewStretchLastWeek: number

  normal: ClientNormal

  locks: LockDate[]
  vendors: Vendor[]
  openItems: OpenItem[]
  activity: Activity[]

  /** Set for an event that has already happened and is in teardown. */
  phase?: 'teardown'
}
