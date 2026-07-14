import type { VitalSeries } from '../../domain/types.ts'
import { bandExtent, trendPoints } from '../../domain/vitals.ts'

interface Props {
  vital: VitalSeries
  tone: string
  height?: number
}

/*
  Fourteen day sparkline. The band is shaded behind the line so you read the reading
  against its own normal, not against zero. Stroke stays one pixel at any width via a
  non scaling stroke, so the line never thickens when the row is wide.
*/
export function Trend({ vital, tone, height = 28 }: Props) {
  const pts = trendPoints(vital)
  const [bandStart, bandEnd] = bandExtent(vital)
  const n = pts.length
  const coords = pts.map((v, i) => `${(i / (n - 1)) * 100},${(1 - v) * 100}`).join(' ')

  return (
    <svg
      width="100%"
      height={height}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="overflow-visible"
    >
      <rect
        x="0"
        y={(1 - bandEnd) * 100}
        width="100"
        height={Math.max(0, (bandEnd - bandStart) * 100)}
        fill="color-mix(in oklab, var(--color-moss) 22%, var(--color-surface))"
      />
      <polyline
        points={coords}
        fill="none"
        stroke={tone}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx="100"
        cy={(1 - pts[n - 1]) * 100}
        r="2.5"
        fill={tone}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
