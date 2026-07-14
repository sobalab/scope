import type { AcuityOrInsufficient } from '../domain/acuity.ts'

interface AcuityMeta {
  label: string
  /** CSS color for text and marks. */
  color: string
  /** Short line the badge can expand to. */
  note: string
}

/*
  Acuity to presentation. Colors are the muted clinical palette, read as gravity not
  as a traffic light. Critical is the deepest tone, not the loudest.
*/
export const ACUITY_META: Record<AcuityOrInsufficient, AcuityMeta> = {
  critical: { label: 'critical', color: 'var(--color-oxblood)', note: 'harm is landing now' },
  acute: { label: 'acute', color: 'var(--color-rust)', note: 'needs a human today' },
  watch: { label: 'watch', color: 'var(--color-ochre)', note: 'worth a glance, harm is weeks out' },
  stable: { label: 'stable', color: 'var(--color-moss)', note: 'nothing needs a human' },
  insufficient: {
    label: 'no baseline',
    color: 'var(--color-ink-soft)',
    note: 'too new to read a trend',
  },
}

/** Light fill behind a badge or chip in the acuity color. */
export const acuityFill = (color: string): string =>
  `color-mix(in oklab, ${color} 13%, var(--color-surface))`

/** Hairline edge in the acuity color, used as a full border, never one sided. */
export const acuityEdge = (color: string): string =>
  `color-mix(in oklab, ${color} 34%, var(--color-surface))`
