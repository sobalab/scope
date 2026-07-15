/*
  Ask the chart, scoped to one project. No API key: answers are composed from the
  project's own vitals and data, so every reply is grounded in a real number and can be
  trusted. Deterministic keyword routing keeps it honest rather than confidently wrong.
*/

import type { Project } from '../domain/types.ts'
import type { AcuityOrInsufficient, Assessment } from '../domain/acuity.ts'
import { attention } from '../data/attention.ts'
import { attentionGap, isFullySilent } from '../domain/attention.ts'
import { chiefComplaint, nextActions } from './diagnose.ts'

// Local phrasing so the ai layer does not reach into the dashboard for copy.
const ACUITY_PHRASE: Record<AcuityOrInsufficient, string> = {
  critical: 'critical',
  acute: 'flagged for today',
  watch: 'on watch',
  stable: 'on track',
  insufficient: 'too new to read',
}

const factValue = (project: Project, kind: keyof Project['vitals'], key: string): string =>
  project.vitals[kind].facts.find((f) => f.label.includes(key))?.value ?? ''

export function starterQuestions(project: Project, assessment: Assessment): string[] {
  const qs = [`Why is ${project.client} ${ACUITY_PHRASE[assessment.acuity]}?`]
  if (project.blockers.some((b) => b.state === 'open')) qs.push(`What is blocking ${project.client}?`)
  qs.push(`Will ${project.client} run out of budget before it ships?`)
  return qs.slice(0, 3)
}

export function askProject(project: Project, assessment: Assessment, question: string): string {
  const q = question.toLowerCase()
  const days = attention[project.id] ?? []

  if (/(block|stuck|waiting)/.test(q)) {
    const open = [...project.blockers].filter((b) => b.state === 'open').sort((a, b) => b.ageDays - a.ageDays)
    if (!open.length) return `Nothing is blocking ${project.client} right now. No open blockers, risks, or questions.`
    const top = open[0]
    const rest = open.length > 1 ? ` There ${open.length === 2 ? 'is 1 more' : `are ${open.length - 1} more`} open.` : ''
    return `The oldest is ${top.title.toLowerCase()}, open ${top.ageDays} days and owned by ${top.owner.toLowerCase()}.${rest}`
  }

  if (/(budget|money|hours|spend|cost)/.test(q)) {
    const hoursPct = Math.round((project.budget.hoursUsed / project.budget.hoursBudget) * 100)
    const scope = project.budget.scopeDelivered
    const gap = hoursPct - scope
    if (gap > 8) {
      return `${project.client} has used ${hoursPct}% of its hours against ${scope}% of scope delivered, ${gap} points ahead. It is spending faster than it ships.`
    }
    return `${project.client} has used ${hoursPct}% of its hours against ${scope}% of scope, roughly in step. Budget is not the problem here.`
  }

  if (/(silent|quiet|touch|attention|abandon|activity)/.test(q)) {
    if (isFullySilent(days)) return `No one has touched ${project.client} in the last 14 days. That silence is why it reads as it does.`
    const gap = attentionGap(days)
    if (gap === 0) return `${project.client} was worked on today. There is no silence to worry about.`
    return `The last time anyone touched ${project.client} was ${gap} ${gap === 1 ? 'day' : 'days'} ago.`
  }

  if (/(do|next|action|fix|should)/.test(q)) {
    const actions = nextActions(project, assessment)
    if (!actions.length) return `Nothing needs doing on ${project.client} today. It is on track.`
    return actions.join(' ')
  }

  if (/(why|reason|what.*wrong|status|how)/.test(q)) {
    const lead = chiefComplaint(project, assessment)
    const quiet = factValue(project, 'pulse', 'quiet')
    // The chief complaint already names the quiet count when pulse is the driver.
    const alreadySaid = assessment.drivers[0] === 'pulse'
    return quiet && !alreadySaid ? `${lead} The client has been quiet ${quiet}.` : lead
  }

  return `I can answer from ${project.client}'s vitals. Try asking about what is blocking it, the budget against scope, or why it is ${ACUITY_PHRASE[assessment.acuity]}.`
}
