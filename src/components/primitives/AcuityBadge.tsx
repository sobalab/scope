import type { ReactNode } from 'react'
import type { AcuityOrInsufficient } from '../../domain/acuity.ts'
import { ACUITY_META, acuityEdge, acuityFill } from '../acuityMeta.ts'

interface Props {
  acuity: AcuityOrInsufficient
}

/** The acuity label, replacing the status dot. Color reads as gravity, not a light. */
export function AcuityBadge({ acuity }: Props) {
  const meta = ACUITY_META[acuity]
  return (
    <span
      className="inline-flex items-center rounded-[var(--radius-chip)] border px-2 py-[3px] font-mono text-[11px] leading-none"
      style={{ color: meta.color, background: acuityFill(meta.color), borderColor: acuityEdge(meta.color) }}
    >
      {meta.label}
    </span>
  )
}

interface MarkerProps {
  children: ReactNode
  title?: string
}

/** A quieter tag for chronic and snoozed, so it reads as context, not alarm. */
export function Marker({ children, title }: MarkerProps) {
  return (
    <span
      title={title}
      className="inline-flex items-center rounded-[var(--radius-chip)] px-1.5 py-[3px] font-mono text-[11px] leading-none text-ink-soft"
      style={{ background: 'color-mix(in oklab, var(--color-ink) 7%, var(--color-surface))' }}
    >
      {children}
    </span>
  )
}
