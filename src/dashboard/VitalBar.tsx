import type { VitalSeries } from '../domain/types.ts'
import { bandExtent, bandStatus, current, readingPosition } from '../domain/vitals.ts'
import { VITAL_META } from './vitalMeta.ts'

const num = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1))

interface Props {
  vital: VitalSeries
}

/*
  One vital as a reference range. The shaded zone is the normal band, the marker is the
  current reading. In a monochrome system, concern reads through the accent and a heavier
  reading, not a red light: an in-band vital recedes in grey, an out-of-band one turns slate.
*/
export function VitalBar({ vital }: Props) {
  const meta = VITAL_META[vital.kind]
  const value = current(vital)
  const [, bandEnd] = bandExtent(vital)
  const pos = readingPosition(vital)
  const out = bandStatus(vital) !== 'in'
  const tone = out ? 'var(--accent)' : 'var(--slate)'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{meta.label}</span>
        <span
          style={{
            fontSize: 13,
            fontWeight: out ? 500 : 400,
            color: out ? 'var(--accent)' : 'var(--muted)',
          }}
        >
          {num(value)}
          <span style={{ fontSize: 10, color: 'var(--slate)', marginLeft: 1 }}>{vital.unit}</span>
        </span>
      </div>
      <div
        style={{
          position: 'relative',
          height: 7,
          marginTop: 7,
          borderRadius: 'var(--radius-pill)',
          background: 'var(--ground-2)',
        }}
        aria-hidden="true"
      >
        {/* the normal band */}
        <div
          style={{
            position: 'absolute',
            inset: '0 auto 0 0',
            left: 0,
            width: `${bandEnd * 100}%`,
            borderRadius: 'var(--radius-pill)',
            background: 'color-mix(in oklab, var(--slate) 26%, var(--ground-2))',
          }}
        />
        {/* the current reading */}
        <div
          style={{
            position: 'absolute',
            top: -2,
            bottom: -2,
            left: `calc(${pos * 100}% - 1.5px)`,
            width: 3,
            borderRadius: 'var(--radius-pill)',
            background: tone,
          }}
        />
      </div>
    </div>
  )
}
