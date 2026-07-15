import type { StandingOrState } from '../domain/standing.ts'
import { STANDING_COLOR, STANDING_WORD } from './standing.ts'

export function StandingChip({ standing }: { standing: StandingOrState }) {
  const quiet = standing === 'onTrack' || standing === 'tooNew'
  return (
    <span className={`standing${quiet ? ' is-quiet' : ''}`}>
      <span className="standing-mark" style={{ background: STANDING_COLOR[standing] }} aria-hidden="true" />
      {STANDING_WORD[standing]}
    </span>
  )
}
