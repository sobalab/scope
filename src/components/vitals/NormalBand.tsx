import type { VitalSeries } from '../../domain/types.ts'
import { bandExtent, readingPosition } from '../../domain/vitals.ts'

interface Props {
  vital: VitalSeries
  /** Concern color for the marker. Neutral ink while in band. */
  tone: string
  height?: number
}

/*
  The reference range, the heart of the signature. A recessed track is the whole
  axis. The shaded region is the normal band. The upright marker is the current
  reading, sitting inside the band or out past it. This is what replaces the status dot.
  Built in CSS so it stays crisp at any width.
*/
export function NormalBand({ vital, tone, height = 8 }: Props) {
  const [bandStart, bandEnd] = bandExtent(vital)
  const pos = readingPosition(vital)

  return (
    <div
      className="relative w-full rounded-full bg-sunk"
      style={{ height }}
      aria-hidden="true"
    >
      {/* the normal band */}
      <div
        className="absolute inset-y-0 rounded-full"
        style={{
          left: `${bandStart * 100}%`,
          width: `${(bandEnd - bandStart) * 100}%`,
          background: 'color-mix(in oklab, var(--color-moss) 26%, var(--color-surface))',
        }}
      />
      {/* the current reading */}
      <div
        className="absolute rounded-full"
        style={{
          left: `calc(${pos * 100}% - 1.5px)`,
          top: -2,
          bottom: -2,
          width: 3,
          background: tone,
        }}
      />
    </div>
  )
}
