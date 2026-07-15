import type { AcuityOrInsufficient } from '../domain/acuity.ts'

/*
  Acuity presentation shared by the ledger tags, the project tabs, and the attention
  trails. One near-monochrome cool ramp that escalates by darkening within the slate
  family, so it never reads as a rainbow. Three of the four steps are literal Frosted
  Glass tokens: stable is --slate, acute is --accent, critical is --accent-strong, and
  watch is the midpoint. OKLab lightness is monotonic, so darker always means sicker.
*/

export const ACUITY_LABEL: Record<AcuityOrInsufficient, string> = {
  critical: 'Critical',
  acute: 'Needs you today',
  watch: 'Watch',
  stable: 'On track',
  insufficient: 'Too new to read',
}

/** Short label for tight spots (tabs, chart). */
export const ACUITY_SHORT: Record<AcuityOrInsufficient, string> = {
  critical: 'Critical',
  acute: 'Acute',
  watch: 'Watch',
  stable: 'On track',
  insufficient: 'Too new',
}

export const ACUITY_COLOR: Record<AcuityOrInsufficient, string> = {
  stable: '#9aa7b4', // --slate
  watch: '#7d94a6', // midpoint of slate and accent
  acute: '#5a7183', // --accent
  critical: '#3f5666', // --accent-strong
  insufficient: '#9aa7b4',
}
