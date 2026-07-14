import type { VitalKind, VitalSeries } from '../../domain/types.ts'
import { VITAL_ORDER } from '../../domain/types.ts'
import { Vital } from './Vital.tsx'

interface Props {
  vitals: Record<VitalKind, VitalSeries>
  variant?: 'row' | 'full'
}

export function VitalsReading({ vitals, variant = 'row' }: Props) {
  const layout =
    variant === 'row'
      ? 'grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4'
      : 'grid grid-cols-1 gap-8 sm:grid-cols-2'
  return (
    <div className={layout}>
      {VITAL_ORDER.map((k) => (
        <Vital key={k} vital={vitals[k]} variant={variant} />
      ))}
    </div>
  )
}
