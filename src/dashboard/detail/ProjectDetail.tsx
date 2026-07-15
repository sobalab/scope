import { useEffect, useState } from 'react'
import { projectById } from '../../data/projects.ts'
import { assess } from '../../domain/acuity.ts'
import { Link } from '../../router.tsx'
import { AcuityTag, Marker } from '../AcuityTag.tsx'
import { ChiefComplaint } from './ChiefComplaint.tsx'
import { Milestones } from './Milestones.tsx'
import { Concerns } from './Concerns.tsx'
import { Activity } from './Activity.tsx'
import { VitalsRail } from './VitalsRail.tsx'
import { BudgetScope } from './BudgetScope.tsx'
import { Resourcing } from './Resourcing.tsx'
import { AskChart } from './AskChart.tsx'
import { Actions } from './Actions.tsx'

function BackLink() {
  return (
    <Link to="/" className="backlink">
      <span aria-hidden="true">‹</span> Overview
    </Link>
  )
}

function Skeleton() {
  const block = (h: number, w: string) => (
    <div style={{ height: h, width: w, background: 'var(--ground-2)', borderRadius: 'var(--radius-md)' }} />
  )
  return (
    <div className="detail">
      <BackLink />
      <div className="detail-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {block(28, '220px')}
          {block(14, '160px')}
        </div>
      </div>
      <div className="detail-grid">
        <div className="work">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {block(22, '80%')}
            {block(22, '55%')}
          </div>
          {block(180, '100%')}
          {block(140, '100%')}
        </div>
        <div className="rail" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {block(180, '100%')}
          {block(120, '100%')}
          {block(140, '100%')}
        </div>
      </div>
    </div>
  )
}

export function ProjectDetail({ id }: { id: string }) {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 320)
    return () => window.clearTimeout(t)
  }, [id])

  const project = projectById(id)

  if (!project) {
    return (
      <div className="detail">
        <BackLink />
        <div className="detail-head">
          <div className="detail-title">No such project</div>
        </div>
        <p className="proj-cc" style={{ marginTop: 16 }}>
          There is no project with the id {id}. It may have been archived.
        </p>
      </div>
    )
  }

  if (loading) return <Skeleton />

  const assessment = assess(project)
  const snoozed = !!project.initiallySnoozed
  const deliveredCount = project.milestones.filter((m) => m.state === 'delivered').length
  const wrappingUp = deliveredCount >= 2 && project.milestones.some((m) => /handoff|handover/i.test(m.title))

  return (
    <div className="detail">
      <BackLink />
      <div className="detail-head">
        <div>
          <h1 className="detail-title">{project.client}</h1>
          <div className="detail-eng">{project.engagement}</div>
        </div>
        <div className="proj-tags">
          {assessment.chronic && <Marker>Chronic, steady</Marker>}
          {snoozed && <Marker>Snoozed</Marker>}
          <AcuityTag acuity={assessment.acuity} />
        </div>
      </div>

      {snoozed && (
        <div className="detail-note" style={{ marginTop: 20 }}>
          Snoozed. It resurfaces tomorrow morning. The acuity is real, you have already handled it.
        </div>
      )}
      {wrappingUp && !snoozed && (
        <div className="detail-note" style={{ marginTop: 20 }}>
          This project is wrapping up. The useful move now is handover, not more triage.
        </div>
      )}

      <div className="detail-grid">
        <div className="work">
          <ChiefComplaint project={project} assessment={assessment} />
          <Milestones milestones={project.milestones} />
          <Concerns blockers={project.blockers} />
          <Activity activity={project.activity} />
        </div>
        <div className="rail">
          <VitalsRail project={project} />
          <BudgetScope budget={project.budget} />
          <Resourcing resourcing={project.resourcing} />
          <AskChart project={project} assessment={assessment} />
          <Actions snoozed={snoozed} />
        </div>
      </div>
    </div>
  )
}
