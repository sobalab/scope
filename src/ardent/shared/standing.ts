import type { StandingOrState } from '../domain/standing.ts'

/*
  Standing presentation. The word renders in ink with the tone as an adjacent mark, so the
  color reinforces and never becomes a status dot. tooNew maps to the quiet neutral.
*/

export const STANDING_WORD: Record<StandingOrState, string> = {
  onTrack: 'On track',
  watch: 'Watch',
  behind: 'Behind',
  atRisk: 'At risk',
  tooNew: 'Too new to read',
}

export const STANDING_COLOR: Record<StandingOrState, string> = {
  onTrack: 'var(--on-track)',
  watch: 'var(--watch)',
  behind: 'var(--behind)',
  atRisk: 'var(--at-risk)',
  tooNew: 'var(--faint)',
}

/** Raw hex for SVG, kept in step with ardent.css. */
export const STANDING_HEX: Record<StandingOrState, string> = {
  onTrack: '#7b746a',
  watch: '#9c7c42',
  behind: '#c07434',
  atRisk: '#b44a1c',
  tooNew: '#a49a8e',
}
