import type { ReactNode } from 'react'
import type { AcuityOrInsufficient } from '../domain/acuity.ts'
import { ACUITY_LABEL } from './acuity.ts'

export function AcuityTag({ acuity }: { acuity: AcuityOrInsufficient }) {
  return <span className={`atag atag-${acuity}`}>{ACUITY_LABEL[acuity]}</span>
}

export function Marker({ children }: { children: ReactNode }) {
  return <span className="marker-tag">{children}</span>
}
