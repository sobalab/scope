import type { VitalSeries } from '../../domain/types.ts'
import { baseline } from '../../domain/baseline.ts'
import { bandStatus, current, trendDirection, weekDelta } from '../../domain/vitals.ts'
import { VITAL_META, vitalTone } from './vitalMeta.ts'
import { NormalBand } from './NormalBand.tsx'
import { Trend } from './Trend.tsx'

const num = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1))

interface DeltaMeta {
  text: string
  tone: string
}

function deltaMeta(v: VitalSeries): DeltaMeta {
  const dir = trendDirection(v)
  if (dir === 'flat') return { text: 'flat', tone: 'var(--color-ink-soft)' }
  const abs = num(Math.abs(weekDelta(v)))
  // rising means the vital is getting worse, so it carries the concern tone
  if (dir === 'rising') return { text: `up ${abs}`, tone: vitalTone(v) }
  return { text: `down ${abs}`, tone: 'var(--color-moss)' }
}

function bandLabel(v: VitalSeries): string {
  const [lo, hi] = v.band
  return lo === 0 ? `under ${hi} ${v.unit}` : `${lo} to ${hi} ${v.unit}`
}

interface Props {
  vital: VitalSeries
  variant?: 'row' | 'full'
}

export function Vital({ vital, variant = 'row' }: Props) {
  const meta = VITAL_META[vital.kind]
  const tone = vitalTone(vital)
  const value = current(vital)
  const delta = deltaMeta(vital)
  const out = bandStatus(vital) !== 'in'
  const ariaLabel = `${meta.label} ${num(value)} ${vital.unit}, ${
    out ? 'outside' : 'within'
  } the normal range of ${bandLabel(vital)}, ${delta.text} since last week`

  if (variant === 'full') {
    return (
      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-mono text-xs text-ink-soft">{meta.label}</span>
          <span className="font-mono text-[11px] text-ink-mute">{meta.system}</span>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="font-display text-4xl leading-none" style={{ color: tone }}>
            {num(value)}
          </span>
          <span className="font-mono text-xs text-ink-soft">{vital.unit}</span>
          <span className="ml-auto font-mono text-[11px]" style={{ color: delta.tone }}>
            {delta.text}
          </span>
        </div>
        <div className="mt-3">
          <NormalBand vital={vital} tone={tone} height={9} />
          <div className="mt-1.5 flex justify-between font-mono text-[11px] text-ink-mute">
            <span>normal {bandLabel(vital)}</span>
            <span>{vital.axisMax}</span>
          </div>
        </div>
        <div className="mt-3">
          <Trend vital={vital} tone={tone} height={30} />
        </div>
        <dl className="mt-3 space-y-1">
          {vital.facts.map((f) => (
            <div key={f.label} className="flex justify-between gap-3 font-mono text-[11px]">
              <dt className="text-ink-soft">{f.label}</dt>
              <dd className="text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    )
  }

  // row variant: compact cell, full detail revealed on hover or keyboard focus
  return (
    <div className="group relative">
      <div
        tabIndex={0}
        role="group"
        aria-label={ariaLabel}
        className="rounded-[var(--radius-chip)] outline-none focus-visible:outline-2 focus-visible:outline-ink"
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-[11px] text-ink-soft">{meta.label}</span>
          <span className="font-mono text-[11px]" style={{ color: delta.tone }}>
            {delta.text}
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="font-display text-2xl leading-none" style={{ color: tone }}>
            {num(value)}
          </span>
          <span className="font-mono text-[10px] text-ink-soft">{vital.unit}</span>
        </div>
        <div className="mt-2">
          <NormalBand vital={vital} tone={tone} height={6} />
        </div>
      </div>

      <div
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-56 origin-top-left scale-95 rounded-[var(--radius-card)] border border-hair bg-surface p-3 opacity-0 shadow-[0_8px_24px_rgba(31,41,51,0.12)] transition duration-150 group-hover:scale-100 group-hover:opacity-100 group-focus-within:scale-100 group-focus-within:opacity-100"
      >
        <p className="font-mono text-[11px] text-ink-soft">
          {meta.label}, {meta.system}
        </p>
        <p className="mt-1 text-sm text-ink">{meta.measures}</p>
        <div className="mt-2 space-y-1 font-mono text-[11px]">
          <div className="flex justify-between gap-3">
            <span className="text-ink-soft">now</span>
            <span className="text-ink">
              {num(value)} {vital.unit}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-ink-soft">normal</span>
            <span className="text-ink">{bandLabel(vital)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-ink-soft">its baseline</span>
            <span className="text-ink">
              {num(baseline(vital))} {vital.unit}, {delta.text} since last week
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
