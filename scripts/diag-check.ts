import { projects } from '../src/data/projects.ts'
import { assess } from '../src/domain/acuity.ts'
import { chiefComplaint, roundsBriefing } from '../src/ai/diagnose.ts'

const entries = projects.map((p) => ({
  project: p,
  assessment: assess(p),
  snoozed: !!p.initiallySnoozed,
}))
console.log('=== ROUNDS BRIEFING ===')
console.log(roundsBriefing(entries))
console.log('\n=== CHIEF COMPLAINTS ===')
for (const e of entries) {
  const tags = `${e.assessment.acuity}${e.assessment.chronic ? ' chronic' : ''}${
    e.snoozed ? ' snoozed' : ''
  }`
  console.log(`\n[${e.project.client} / ${tags}]\n  ${chiefComplaint(e.project, e.assessment)}`)
}
