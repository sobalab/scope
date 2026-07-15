/*
  The written assistance, composed from the signals so every line traces to a real number
  and can never drift. Mock mode streams these; a live model would be handed the same
  numbers and asked for the same shape. It advises, it never decides, and it admits when a
  read is soft.
*/

import type { EventRecord } from '../domain/types.ts'
import { events } from '../data/events.ts'
import { assess } from '../domain/standing.ts'
import type { Assessment } from '../domain/standing.ts'
import { compareAssessments } from '../domain/standing.ts'

const round = (n: number): number => Math.round(n)
const committedPct = (e: EventRecord): number => round((e.budget.committed / e.budget.cap) * 100)
const pendingNearLock = (e: EventRecord) => e.vendors.filter((v) => !v.contracted && v.lockDaysFromToday <= 10)

export interface Source {
  label: string
  value: string
}

/** The reason phrase for an event's top driver, with a real number in it. */
export function driverReason(e: EventRecord, a: Assessment): string {
  switch (a.drivers[0]) {
    case 'readiness':
      return `only ${round(e.readiness * 100)}% is locked with ${e.showDaysFromToday} days to go`
    case 'waiting': {
      const pending = pendingNearLock(e)
      if (pending.length) return `the ${pending[0].role.toLowerCase()} still has not confirmed`
      return `the client has gone quiet ${e.clientReplyDays} days`
    }
    case 'budget':
      return `committed sits at ${committedPct(e)}% of the cap`
    case 'crew': {
      const c = e.crew.find((m) => m.collidesWith)
      const peak = round(Math.max(...e.crew.map((m) => m.stretch)) * 100)
      return c ? `${c.name} is double booked with ${c.collidesWith}` : `the crew is stretched to ${peak}%`
    }
  }
}

interface Entry {
  e: EventRecord
  a: Assessment
}

function ranked(setAside: Set<string>): Entry[] {
  return events
    .map((e) => ({ e, a: assess(e) }))
    .filter((x) => !setAside.has(x.e.id))
    .sort((x, y) => compareAssessments(x.a, y.a))
}

export interface Written {
  text: string
  sources: Source[]
}

export function morningRead(setAside: Set<string> = new Set()): Written {
  const entries = ranked(setAside)
  const chase = entries.find((x) => x.a.standing === 'atRisk' || x.a.standing === 'behind')

  if (!chase) {
    return {
      text: 'Nothing to chase today, everything is inside its guardrails. The nearest lock is still days out and no client has gone quiet.',
      sources: [],
    }
  }

  const sentences: string[] = []
  const sources: Source[] = []

  const missed = chase.e.locks.find((l) => l.daysFromToday < 0 && !l.locked)
  const lead = missed
    ? `${chase.e.name} is ${chase.e.showDaysFromToday} days out with the ${missed.label.toLowerCase()} already passed, so chase that first.`
    : `${chase.e.name} is ${chase.e.showDaysFromToday} days out and ${driverReason(chase.e, chase.a)}, so chase that first.`
  sentences.push(lead)
  sources.push({ label: `${chase.e.client} days to show`, value: `${chase.e.showDaysFromToday}` })
  if (missed) sources.push({ label: 'missed lock', value: missed.label })

  const fine = entries.find((x) => x.a.standing === 'onTrack' && !x.e.phase && x.e.id !== chase.e.id)
  if (fine) {
    sentences.push(`${fine.e.client} is fine.`)
    sources.push({ label: `${fine.e.client} standing`, value: 'on track' })
  }

  const normal = entries.find((x) => x.a.behindButNormal)
  if (normal) {
    sentences.push(
      `${normal.e.client}'s client has gone quiet ${normal.e.clientReplyDays} days, but that is normal for them.`,
    )
    sources.push({ label: `${normal.e.client} client quiet`, value: `${normal.e.clientReplyDays} days` })
  }

  return { text: sentences.join(' '), sources }
}

export function whatToWatch(e: EventRecord, a: Assessment): Written {
  if (a.tooNew) {
    return {
      text: `${e.name} is ${e.showDaysFromToday} days out with almost nothing logged yet, so this read is soft.`,
      sources: [
        { label: 'days to show', value: `${e.showDaysFromToday}` },
        { label: 'locked', value: `${round(e.readiness * 100)}%` },
      ],
    }
  }
  if (e.phase === 'teardown') {
    const openInvoice = e.openItems.find((o) => /invoice/i.test(o.title))
    return {
      text: `${e.name} is done and in teardown. The useful move now is closing out ${
        openInvoice ? openInvoice.owner.toLowerCase() + "'s final invoice" : 'the final invoices'
      }, not triage.`,
      sources: [{ label: 'show day', value: `${Math.abs(e.showDaysFromToday)} days ago` }],
    }
  }
  if (a.behindButNormal) {
    return {
      text: `${e.name} is behind, ${round(e.readiness * 100)}% locked, but that is exactly how ${e.client} always runs, so it sits quiet.`,
      sources: [
        { label: 'locked', value: `${round(e.readiness * 100)}%` },
        { label: 'usual for this client', value: 'yes' },
      ],
    }
  }
  const missed = e.locks.find((l) => l.daysFromToday < 0 && !l.locked)
  const text = missed
    ? `${e.name} is at risk because the ${missed.label.toLowerCase()} passed and ${missed.breaksIf}.`
    : `${e.name} is where it is because ${driverReason(e, a)}.`
  const s = signalFacts(e, a)
  return { text, sources: s }
}

function signalFacts(e: EventRecord, a: Assessment): Source[] {
  const driver = a.drivers[0]
  if (driver === 'readiness')
    return [
      { label: 'locked', value: `${round(e.readiness * 100)}%` },
      { label: 'days to show', value: `${e.showDaysFromToday}` },
    ]
  if (driver === 'waiting') {
    const pending = pendingNearLock(e)
    return pending.length
      ? [{ label: 'unconfirmed near lock', value: `${pending[0].role}` }, { label: 'client quiet', value: `${e.clientReplyDays} days` }]
      : [{ label: 'client quiet', value: `${e.clientReplyDays} days` }]
  }
  if (driver === 'budget') return [{ label: 'committed', value: `${committedPct(e)}% of cap` }]
  const c = e.crew.find((m) => m.collidesWith)
  return c ? [{ label: 'double booked', value: `${c.name} with ${c.collidesWith}` }] : []
}

export function starters(e: EventRecord, a: Assessment): string[] {
  const qs: string[] = []
  const pending = pendingNearLock(e)
  if (pending.length) qs.push(`What happens if ${pending[0].name} misses the lock`)
  if (e.crew.some((c) => c.collidesWith)) qs.push('Who is double booked this weekend')
  qs.push(`Why is ${e.client} ${standingWord(a)}`)
  return qs.slice(0, 3)
}

function standingWord(a: Assessment): string {
  if (a.tooNew) return 'too new to read'
  return { atRisk: 'at risk', behind: 'behind', watch: 'on watch', onTrack: 'on track' }[a.standing as 'atRisk']
}

export function ask(e: EventRecord, a: Assessment, question: string): string {
  const q = question.toLowerCase()

  if (/(miss|lock|late|confirm)/.test(q)) {
    const pending = pendingNearLock(e)
    if (pending.length) {
      const v = pending[0]
      const lock = e.locks.find((l) => !l.locked && l.daysFromToday >= 0)
      return `${v.name} locks in ${v.lockDaysFromToday} days. If they miss it${
        lock ? ` the ${lock.label.toLowerCase()} slips and ${lock.breaksIf}` : ' the build cannot be confirmed'
      }. Chase them now, not after the weekend.`
    }
    const missed = e.locks.find((l) => l.daysFromToday < 0 && !l.locked)
    if (missed) return `The ${missed.label.toLowerCase()} already passed, and ${missed.breaksIf}. That is the one to move on today.`
    return `Every vendor on ${e.client} is contracted and every passed lock is closed, so nothing is waiting on a lock right now.`
  }

  if (/(double|booked|crew|weekend|who|people)/.test(q)) {
    const c = e.crew.find((m) => m.collidesWith)
    if (c) return `${c.name} is on both ${e.name} and ${c.collidesWith} the same weekend. One of the two needs a second lead, and ${e.name} is the tighter of the two.`
    const peak = round(Math.max(...e.crew.map((m) => m.stretch)) * 100)
    return `No one on ${e.client} is double booked. The crew peaks at ${peak}% stretch, which is inside the usual range.`
  }

  if (/(budget|money|deposit|spend|cost)/.test(q)) {
    const unspent = Math.round((e.budget.committed - e.budget.spent) / 1000)
    return `${e.client} has committed ${committedPct(e)}% of the cap, and $${unspent}k of that is committed but unspent. Those are vendor deposits, so they do not come back if anything moves.`
  }

  if (/(why|behind|risk|watch|status|how)/.test(q)) {
    return whatToWatch(e, a).text
  }

  if (a.tooNew) {
    return `${e.name} is ${e.showDaysFromToday} days out with almost nothing logged, so I can only say a little. Ask again once the venue shortlist is in.`
  }

  return `I can answer from ${e.client}'s signals. Try asking what happens if a vendor misses its lock, who is double booked, or where the budget stands.`
}
