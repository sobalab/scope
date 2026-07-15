import { useEffect, useMemo, useState } from 'react'
import type { AcuityOrInsufficient, Assessment } from '../domain/acuity.ts'
import type { Project } from '../domain/types.ts'
import { VITAL_ORDER } from '../domain/types.ts'
import { assess, compareAssessments } from '../domain/acuity.ts'
import { attentionGap, isFullySilent } from '../domain/attention.ts'
import { projects } from '../data/projects.ts'
import { attention } from '../data/attention.ts'
import { chiefComplaint, nextActions, roundsBriefing } from '../ai/diagnose.ts'
import { GlassPanel } from '../ds/GlassPanel.tsx'
import { projectPath, useRouter } from '../router.tsx'
import { AcuityTag, Marker } from './AcuityTag.tsx'
import { VitalBar } from './VitalBar.tsx'
import { AttentionTrails } from './AttentionTrails.tsx'

// Persists which project you last opened, so it reads as selected when you return.
let lastOpened: string | null = null

interface Entry {
  project: Project
  assessment: Assessment
  snoozed: boolean
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'attention', label: 'Needs attention' },
  { key: 'ontrack', label: 'On track' },
] as const
type FilterKey = (typeof FILTERS)[number]['key']

function silenceLabel(project: Project): string {
  const days = attention[project.id] ?? []
  if (isFullySilent(days)) return 'silent 14 days'
  const g = attentionGap(days)
  return g === 0 ? 'active today' : `quiet ${g} ${g === 1 ? 'day' : 'days'}`
}

function ProjectCard({
  entry,
  selected,
  onOpen,
}: {
  entry: Entry
  selected: boolean
  onOpen: () => void
}) {
  const { project, assessment, snoozed } = entry
  const actions = nextActions(project, assessment)
  return (
    <article
      className={`proj clickable${snoozed ? ' proj-snoozed' : ''}${selected ? ' selected' : ''}`}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
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
          {assessment.chronic && <Marker>Chronic, steady</Marker>}
          {snoozed && <Marker>Snoozed</Marker>}
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
}

export function Overview() {
  const { navigate } = useRouter()
  const [selectedId] = useState<string | null>(lastOpened)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 620)
    return () => window.clearTimeout(t)
  }, [])

  const entries = useMemo<Entry[]>(
    () =>
      projects
        .map((p) => ({ project: p, assessment: assess(p), snoozed: !!p.initiallySnoozed }))
        .sort((a, b) => compareAssessments(a.assessment, b.assessment)),
    [],
  )

  const open = (project: Project) => {
    lastOpened = project.id
    navigate(projectPath(project.id))
  }

  const inFilter = (a: AcuityOrInsufficient): boolean => {
    if (filter === 'all') return true
    if (filter === 'attention') return a === 'acute' || a === 'critical' || a === 'watch'
    return a === 'stable'
  }
  const filtered = entries.filter((e) => inFilter(e.assessment.acuity))
  const filteredProjects = filtered.map((e) => e.project)

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
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Client project health</div>
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

      <div className="chart-head">
        <h2 className="ledger-eyebrow">Attention, last 14 days</h2>
        <div className="filter" role="group" aria-label="Filter projects">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={filter === f.key ? 'on' : ''}
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-panel">
        {filteredProjects.length ? (
          <AttentionTrails
            key={ready ? 'ready' : 'loading'}
            projects={filteredProjects}
            attention={attention}
            onSelect={open}
            selectedId={selectedId}
            state={ready ? 'ready' : 'loading'}
          />
        ) : (
          <div className="empty">No projects in this view.</div>
        )}
      </div>

      <h2 className="ledger-eyebrow">Jump to a project</h2>
      <div className="tabs-row">
        {entries.map((e) => (
          <button
            key={e.project.id}
            className={`ptab${selectedId === e.project.id ? ' on' : ''}`}
            aria-current={selectedId === e.project.id ? 'true' : undefined}
            onClick={() => open(e.project)}
          >
            <span className="ptab-name">{e.project.client}</span>
            <span className="ptab-meta">
              <AcuityTag acuity={e.assessment.acuity} />
              <span className="ptab-silence">{silenceLabel(e.project)}</span>
            </span>
          </button>
        ))}
      </div>

      <h2 className="ledger-eyebrow">Active projects, ranked by what needs attention</h2>
      <div className="ledger">
        {filtered.map((e) => (
          <ProjectCard key={e.project.id} entry={e} selected={selectedId === e.project.id} onOpen={() => open(e.project)} />
        ))}
      </div>
    </div>
  )
}
