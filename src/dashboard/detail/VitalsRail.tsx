import type { Project, VitalSeries } from '../../domain/types.ts'
import { VITAL_ORDER } from '../../domain/types.ts'
import { bandExtent, bandStatus, current, trendDirection, trendPoints, weekDelta } from '../../domain/vitals.ts'
import { VITAL_META } from '../vitalMeta.ts'

const num = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1))

const deltaPhrase = (v: VitalSeries): string => {
  const dir = trendDirection(v)
  if (dir === 'flat') return 'flat since last week'
  const abs = num(Math.abs(weekDelta(v)))
  return dir === 'rising' ? `up ${abs} since last week` : `down ${abs} since last week`
}

const bandPhrase = (v: VitalSeries): string =>
  v.band[0] === 0 ? `normal under ${v.band[1]} ${v.unit}` : `normal ${v.band[0]} to ${v.band[1]} ${v.unit}`

function Spark({ v, tone }: { v: VitalSeries; tone: string }) {
  const pts = trendPoints(v)
  const [b0, b1] = bandExtent(v)
  const n = pts.length
  const coords = pts.map((p, i) => `${(i / (n - 1)) * 100},${(1 - p) * 100}`).join(' ')
  return (
    <svg width="100%" height="26" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style={{ overflow: 'visible' }}>
      <rect x="0" y={(1 - b1) * 100} width="100" height={Math.max(0, (b1 - b0) * 100)} fill="color-mix(in oklab, var(--slate) 20%, var(--ground-2))" />
      <polyline points={coords} fill="none" stroke={tone} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx="100" cy={(1 - pts[n - 1]) * 100} r="2.5" fill={tone} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function VitalsRail({ project }: { project: Project }) {
  return (
    <div className="panel">
      <h2 className="panel-title">Vitals</h2>
      <div className="rail-vitals">
        {VITAL_ORDER.map((k) => {
          const v = project.vitals[k]
          const out = bandStatus(v) !== 'in'
          const tone = out ? 'var(--accent)' : 'var(--slate)'
          return (
            <div key={k}>
              <div className="rv-head">
                <span className="rv-name">{VITAL_META[k].label}</span>
                <span className={`rv-reading ${out ? 'out' : ''}`}>
                  {num(current(v))}
                  <small> {v.unit}</small>
                </span>
              </div>
              <div style={{ marginTop: 7 }}>
                <Spark v={v} tone={tone} />
              </div>
              <div className="rv-delta">
                {bandPhrase(v)}, {deltaPhrase(v)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
