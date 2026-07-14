/*
  The diagnostic voice, derived from the vitals rather than invented.

  Every sentence is composed from numbers that exist in the data, so a claim can
  always be traced back to a reading. Mock mode streams these directly. Live mode
  hands the same numbers to the model and asks for the same shape. Either way the
  words cannot drift away from the vitals.

  Honesty is built in: a project with no baseline is told it has no baseline, and a
  chronically poor project is described as normal for itself, not alarmed over.
*/

import type { Project, VitalKind, VitalSeries } from '../domain/types.ts'
import type { Assessment } from './../domain/acuity.ts'
import { vitalLoad } from '../domain/acuity.ts'

const factValue = (v: VitalSeries, key: string): string =>
  v.facts.find((f) => f.label.includes(key))?.value ?? ''

const driverSentence = (project: Project, assessment: Assessment): string => {
  const kind = assessment.drivers[0]
  const v = project.vitals[kind]
  const gate = project.gate

  switch (kind) {
    case 'pulse': {
      const quiet = factValue(v, 'quiet') || factValue(v, 'replied')
      const gatePart = gate
        ? ` and ${gate.label.toLowerCase()} gates ${gate.blocks} in ${gate.daysAway} days`
        : ' and nothing has shipped in days'
      return `Silence is the problem. The client has been quiet ${quiet}${gatePart}.`
    }
    case 'pressure': {
      const hours = factValue(v, 'hours')
      const scope = factValue(v, 'scope')
      const harmWeeks = Math.round(assessment.timeToHarmDays / 7)
      const tail =
        assessment.acuity === 'watch' && harmWeeks >= 2
          ? `, with about ${harmWeeks} weeks of runway`
          : ' and it is not slowing'
      return `Budget is running ahead of scope, ${hours} of hours used against ${scope} delivered${tail}.`
    }
    case 'respiration': {
      const oldest = factValue(v, 'oldest')
      const flow = factValue(v, 'opened')
      return `Work is not flowing. The oldest blocker has been open ${oldest}, and blockers ran ${flow} over two weeks.`
    }
    case 'temperature': {
      const reqs = factValue(v, 'new requests')
      const base = factValue(v, 'baseline')
      return `Scope keeps moving, ${reqs} new requests in two weeks against a baseline of ${base}.`
    }
  }
}

const chronicSentence = (project: Project): string => {
  const quiet = factValue(project.vitals.pulse, 'quiet')
  return `Normal for ${project.client}. It has sat around ${quiet} quiet for months, and nothing changed this week.`
}

const stableSentence = (project: Project): string => {
  const next = project.milestones
    .filter((m) => m.state === 'current' || m.state === 'upcoming')
    .sort((a, b) => a.dueInDays - b.dueInDays)[0]
  const tail = next ? `, ${next.title.toLowerCase()} is ${next.dueInDays} days out` : ''
  return `Every vital is in range${tail}.`
}

export const chiefComplaint = (project: Project, assessment: Assessment): string => {
  if (assessment.insufficient) {
    return `${project.client} is ${project.ageDays} days old, so there is no baseline yet and this read is weak.`
  }
  if (assessment.chronic) return chronicSentence(project)
  if (assessment.acuity === 'stable') return stableSentence(project)
  return driverSentence(project, assessment)
}

export interface PortfolioEntry {
  project: Project
  assessment: Assessment
  snoozed: boolean
}

export const roundsBriefing = (entries: PortfolioEntry[]): string => {
  const live = entries.filter((e) => !e.snoozed)
  const featured = live
    .filter((e) => e.assessment.acuity === 'acute' || e.assessment.acuity === 'critical')
    .sort((a, b) => a.assessment.timeToHarmDays - b.assessment.timeToHarmDays)[0]

  const sentences: string[] = []

  if (featured) {
    const p = featured.project
    const gate = p.gate
    const quiet =
      factValue(p.vitals.pulse, 'quiet') || factValue(p.vitals.respiration, 'oldest')
    const why = gate
      ? `${gate.label.toLowerCase()} gates ${gate.blocks} in ${gate.daysAway} days`
      : `it is ${featured.assessment.acuity}`
    sentences.push(
      `${p.client} has been quiet ${quiet} and ${why}, so it is the one thing that needs you today.`,
    )
  } else {
    sentences.push('Nothing crossed into acute overnight, so no project needs you today.')
  }

  const snoozedCritical = entries.find(
    (e) => e.snoozed && e.assessment.acuity === 'critical',
  )
  if (snoozedCritical) {
    sentences.push(
      `${snoozedCritical.project.client} is still critical but you snoozed it, so it stays out of the way until you bring it back.`,
    )
  }

  const watch = live.find((e) => e.assessment.acuity === 'watch')
  if (watch && sentences.length < 3) {
    const hours = factValue(watch.project.vitals.pressure, 'hours')
    const scope = factValue(watch.project.vitals.pressure, 'scope')
    sentences.push(
      `${watch.project.client} is spending faster than it ships, ${hours} of hours against ${scope} delivered, but the harm is weeks out.`,
    )
  }

  const chronic = entries.find((e) => e.assessment.chronic)
  if (chronic && sentences.length < 3) {
    sentences.push(`${chronic.project.client} slipped again, which is normal for ${chronic.project.client}.`)
  }

  return sentences.join(' ')
}

/*
  What should happen next. Concrete, owner-facing actions derived from the vitals that
  are actually out of range, plus the soonest gate. Advisory, never automatic: the team
  decides and acts. On-track projects return nothing, which is itself the answer.
*/
const actionForVital = (project: Project, kind: VitalKind): string | null => {
  const v = project.vitals[kind]
  switch (kind) {
    case 'pulse':
      return `Reply to the client and get the team shipping again, quiet ${
        factValue(v, 'quiet') || factValue(v, 'replied')
      }.`
    case 'pressure':
      return `Reset budget and scope with the client, ${factValue(v, 'hours')} of hours used against ${factValue(
        v,
        'scope',
      )} delivered.`
    case 'respiration': {
      const b = project.blockers.find((x) => x.state === 'open')
      return b
        ? `Unblock ${b.title.toLowerCase()}, open ${b.ageDays} days and owned by ${b.owner.toLowerCase()}.`
        : `Clear the oldest open blocker, ${factValue(v, 'oldest')}.`
    }
    case 'temperature':
      return `Re-scope with the client, ${factValue(v, 'new requests')} new requests in two weeks.`
  }
}

export const nextActions = (project: Project, assessment: Assessment): string[] => {
  if (assessment.insufficient) {
    return [`Check back once ${project.client} has two full weeks of history to read.`]
  }
  if (assessment.chronic) {
    return [`Leave it. This is normal for ${project.client} and nothing changed this week.`]
  }
  if (assessment.acuity === 'stable') return []

  const out: string[] = []
  if (project.gate) {
    out.push(
      `Clear the ${project.gate.label.toLowerCase()} before it gates ${project.gate.blocks} in ${project.gate.daysAway} days.`,
    )
  }
  for (const kind of assessment.drivers) {
    if (out.length >= 3) break
    if (vitalLoad(project.vitals[kind]) < 0.25) continue
    const action = actionForVital(project, kind)
    if (action && !out.includes(action)) out.push(action)
  }
  return out.slice(0, 3)
}
