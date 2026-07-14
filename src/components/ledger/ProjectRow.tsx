import { forwardRef } from 'react'
import type { ReactNode } from 'react'
import type { Project } from '../../domain/types.ts'
import type { Assessment } from '../../domain/acuity.ts'
import { dayPhrase } from '../../lib/format.ts'
import { AcuityBadge, Marker } from '../primitives/AcuityBadge.tsx'
import { VitalsReading } from '../vitals/VitalsReading.tsx'

export function harmPhrase(project: Project, assessment: Assessment): string {
  if (assessment.insufficient) return `${project.ageDays} days in, no baseline yet`
  if (project.gate) return `${project.gate.label.toLowerCase()} ${dayPhrase(project.gate.daysAway)}`
  const next = project.milestones
    .filter((m) => m.state === 'current' || m.state === 'upcoming' || m.state === 'slipped')
    .sort((a, b) => a.dueInDays - b.dueInDays)[0]
  return next ? `${next.title.toLowerCase()} ${dayPhrase(next.dueInDays)}` : 'no dated milestones'
}

interface Props {
  project: Project
  assessment: Assessment
  complaint: ReactNode
  snoozed: boolean
  selected: boolean
  onOpen: () => void
  onSnooze: () => void
}

export const ProjectRow = forwardRef<HTMLDivElement, Props>(function ProjectRow(
  { project, assessment, complaint, snoozed, selected, onOpen, onSnooze },
  ref,
) {
  return (
    <div
      ref={ref}
      onClick={onOpen}
      className={`group/row cursor-pointer rounded-[var(--radius-card)] px-5 py-5 transition-colors ${
        snoozed ? 'opacity-60' : ''
      } ${selected ? 'bg-surface' : 'hover:bg-surface'}`}
      style={selected ? { boxShadow: 'inset 0 0 0 2px var(--color-ink)' } : undefined}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpen()
              }}
              className="rounded-sm font-sans text-lg font-semibold text-ink hover:underline"
            >
              {project.client}
            </button>
            <span className="truncate font-sans text-sm text-ink-soft">{project.engagement}</span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-ink-mute">{harmPhrase(project, assessment)}</p>
        </div>

        <div className="flex items-center gap-2">
          {assessment.chronic && (
            <Marker title="Objectively poor, but flat against its own baseline. Not deteriorating.">
              chronic
            </Marker>
          )}
          {snoozed ? (
            <Marker title="Handled. Muted until you bring it back.">snoozed</Marker>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSnooze()
              }}
              className="rounded-[var(--radius-chip)] px-1.5 py-[3px] font-mono text-[11px] text-ink-mute opacity-0 transition hover:text-ink focus-visible:opacity-100 group-hover/row:opacity-100"
            >
              snooze
            </button>
          )}
          <AcuityBadge acuity={assessment.acuity} />
        </div>
      </div>

      <div className="mt-3 max-w-[62ch] font-display text-[17px] leading-snug text-ink">
        {complaint}
      </div>

      <div className="mt-5">
        <VitalsReading vitals={project.vitals} variant="row" />
      </div>
    </div>
  )
})
