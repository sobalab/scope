import { assess, compareAssessments } from '../domain/acuity.ts'
import type { AcuityOrInsufficient, Assessment } from '../domain/acuity.ts'
import type { Project } from '../domain/types.ts'
import { VITAL_ORDER } from '../domain/types.ts'
import { projects } from '../data/projects.ts'
import { chiefComplaint, nextActions, roundsBriefing } from '../ai/diagnose.ts'
import { GlassPanel } from '../ds/GlassPanel.tsx'
import { VitalBar } from './VitalBar.tsx'

interface Entry {
  project: Project
  assessment: Assessment
  snoozed: boolean
}

const ACUITY_LABEL: Record<AcuityOrInsufficient, string> = {
  critical: 'Critical',
  acute: 'Needs you today',
  watch: 'Watch',
  stable: 'On track',
  insufficient: 'Too new to read',
}

function AcuityTag({ acuity }: { acuity: AcuityOrInsufficient }) {
  return <span className={`atag atag-${acuity}`}>{ACUITY_LABEL[acuity]}</span>
}

export function StudioDashboard() {
  const entries: Entry[] = projects
    .map((p) => ({ project: p, assessment: assess(p), snoozed: !!p.initiallySnoozed }))
    .sort((a, b) => compareAssessments(a.assessment, b.assessment))

  const isHot = (e: Entry) => e.assessment.acuity === 'acute' || e.assessment.acuity === 'critical'
  const featured = entries.find((e) => !e.snoozed && isHot(e))

  const lead = featured
    ? featured.assessment.acuity === 'critical'
      ? `${featured.project.client} is critical today.`
      : `${featured.project.client} needs you today.`
    : 'Nothing needs you today.'

  const counts = {
    needYou: entries.filter((e) => !e.snoozed && isHot(e)).length,
    watch: entries.filter((e) => e.assessment.acuity === 'watch').length,
    onTrack: entries.filter((e) => e.assessment.acuity === 'stable').length,
    tooNew: entries.filter((e) => e.assessment.insufficient).length,
    snoozed: entries.filter((e) => e.snoozed).length,
  }

  return (
    <div className="dash">
      <header className="dash-head">
        <div>
          <div className="wordmark">Fieldwork</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
            Client project health
          </div>
        </div>
        <div className="dash-date">Today, July 14</div>
      </header>

      <GlassPanel finish="light" style={{ padding: '28px 30px', borderRadius: 'var(--radius-2xl)' }}>
        <div className="brief-grid">
          <div>
            <div className="brief-eyebrow">Rounds</div>
            <h1 className="brief-lead">{lead}</h1>
            <p className="brief-body">{roundsBriefing(entries)}</p>
          </div>
          <div className="portfolio">
            <div className="pf-title">Portfolio</div>
            <div className="pf-row">
              <span className="pf-label">Needs you</span>
              <span className="pf-value hot">{counts.needYou}</span>
            </div>
            <div className="pf-row">
              <span className="pf-label">To watch</span>
              <span className="pf-value">{counts.watch}</span>
            </div>
            <div className="pf-row">
              <span className="pf-label">On track</span>
              <span className="pf-value">{counts.onTrack}</span>
            </div>
            <div className="pf-row">
              <span className="pf-label">Too new to read</span>
              <span className="pf-value">{counts.tooNew}</span>
            </div>
            <div className="pf-row">
              <span className="pf-label">Snoozed</span>
              <span className="pf-value">{counts.snoozed}</span>
            </div>
          </div>
        </div>
      </GlassPanel>

      <div className="ledger-eyebrow">Active projects, ranked by what needs attention</div>
      <div className="ledger">
        {entries.map((e) => {
          const { project, assessment, snoozed } = e
          const actions = nextActions(project, assessment)
          const isFeatured = e === featured
          return (
            <article
              key={project.id}
              className={`proj${snoozed ? ' proj-snoozed' : ''}`}
              style={
                isFeatured
                  ? {
                      borderColor: 'color-mix(in oklab, var(--accent) 42%, var(--border-default))',
                      boxShadow: 'var(--shadow-card)',
                    }
                  : undefined
              }
            >
              <div className="proj-top">
                <div style={{ minWidth: 0 }}>
                  <div className="proj-name">
                    {project.client}
                    <span className="proj-eng">{project.engagement}</span>
                  </div>
                  <p className="proj-cc">{chiefComplaint(project, assessment)}</p>
                </div>
                <div className="proj-tags">
                  {assessment.chronic && <span className="marker-tag">Chronic, steady</span>}
                  {snoozed && <span className="marker-tag">Snoozed</span>}
                  <AcuityTag acuity={assessment.acuity} />
                </div>
              </div>

              <div className="proj-mid">
                <div>
                  <div className="actions-eyebrow">Vitals</div>
                  <div className="proj-vitals">
                    {VITAL_ORDER.map((k) => (
                      <VitalBar key={k} vital={project.vitals[k]} />
                    ))}
                  </div>
                </div>
                <div className="proj-actions">
                  <div className="actions-eyebrow">Next</div>
                  {actions.length ? (
                    actions.map((a) => (
                      <div key={a} className="act">
                        {a}
                      </div>
                    ))
                  ) : (
                    <div className="act-rest">Nothing needed today. Keep shipping.</div>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
