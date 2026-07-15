import type { Project } from '../../domain/types.ts'
import type { Assessment } from '../../domain/acuity.ts'
import { chiefComplaint } from '../../ai/diagnose.ts'
import { VITAL_META } from '../vitalMeta.ts'

/*
  The answer to "why am I here". One diagnostic sentence, with the vital that produced it
  traceable right underneath, so the sentence can never float free of a real number.
*/
export function ChiefComplaint({ project, assessment }: { project: Project; assessment: Assessment }) {
  const sentence = chiefComplaint(project, assessment)
  const driver = assessment.drivers[0]
  const facts = project.vitals[driver].facts

  return (
    <section>
      <h2 className="sec-title">Why this project is here</h2>
      <p className="cc-lead">{sentence}</p>
      <div className="cc-source">
        <span className="cc-chip">{VITAL_META[driver].label}</span>
        {facts.map((f) => (
          <span key={f.label} className="cc-chip">
            {f.label} <b>{f.value}</b>
          </span>
        ))}
      </div>
    </section>
  )
}
