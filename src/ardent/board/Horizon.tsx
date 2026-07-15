import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { events } from '../data/events.ts'
import { assess, compareAssessments } from '../domain/standing.ts'
import type { Assessment } from '../domain/standing.ts'
import type { EventRecord } from '../domain/types.ts'
import { clamp01, elapsedFraction } from '../domain/signals.ts'
import { STANDING_HEX, STANDING_WORD } from '../shared/standing.ts'
import { dateLabel } from '../lib/dates.ts'
import { driverReason } from '../ai/compose.ts'

/*
  The horizon. Each event is an arc about one shared origin in the lower left. Radius is
  time left, so the soonest event is the tight inner ring about to land. The arc runs from
  the kickoff ray (8deg) to the show day meridian (80deg); a head sits at today, solid
  behind it, dashed ahead. Readiness rides a second line 14px inside, and when it lags
  today a wedge opens between the two lines: that wedge is the trouble. A hatched band
  underneath shows where this client normally sits, so behind-as-usual reads differently
  from just-slipped. Exactly one event may glow, the most urgent, and only if it is at
  risk. Light is data here: it marks the present head of the fire and nothing else.
*/

const A0 = 8
const A_END = 80
const SWEEP = A_END - A0
const PAD_TOP = 48
const PAD_RIGHT = 64
const PAD_LEFT = 96
const PAD_BOTTOM = 96
const RING_GAP = 38
const READY_INSET = 15

const rad = (deg: number): number => (deg * Math.PI) / 180

interface ArcModel {
  e: EventRecord
  a: Assessment
  daysLeft: number
  elapsed: number
  headAngle: number
  readyAngle: number
  baseAngle: number
  color: string
  landed: boolean
}

function buildModels(): ArcModel[] {
  return events
    .map((e) => {
      const a = assess(e)
      const elapsed = elapsedFraction(e)
      return {
        e,
        a,
        daysLeft: Math.max(0, e.showDaysFromToday),
        elapsed,
        headAngle: A0 + elapsed * SWEEP,
        readyAngle: A0 + clamp01(e.readiness) * SWEEP,
        baseAngle: A0 + clamp01(elapsed - e.normal.readinessGap) * SWEEP,
        color: STANDING_HEX[a.standing],
        landed: e.phase === 'teardown' || e.showDaysFromToday <= 0,
      }
    })
    .sort((x, y) => x.daysLeft - y.daysLeft) // ascending: innermost ring first
}

/** sqrt-compressed radius over a fixed honest domain, then a min-gap pass. */
function radii(models: ArcModel[], rMin: number, rMax: number): number[] {
  const S6 = Math.sqrt(6)
  const S190 = Math.sqrt(190)
  const rs = models.map((m) => {
    const d = Math.min(190, Math.max(6, m.daysLeft))
    const frac = (Math.sqrt(d) - S6) / (S190 - S6)
    return rMin + (rMax - rMin) * frac
  })
  for (let i = 1; i < rs.length; i++) rs[i] = Math.max(rs[i], rs[i - 1] + RING_GAP)
  return rs
}

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/*
  One-shot guard for the load bloom. Time-based so StrictMode's dev double-mount still
  plays it once, while navigating back to the board later does not replay it.
*/
let horizonPlayedAt = 0

interface Props {
  onOpen: (id: string) => void
  setAside: ReadonlySet<string>
  onSetAside: (id: string) => void
}

export function Horizon({ onOpen, setAside, onSetAside }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(1080)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [focusIdxRaw, setFocusIdx] = useState<number | null>(null)
  const [focused, setFocused] = useState(false)
  const [cursorDay, setCursorDay] = useState<number | null>(null) // offset from today on the focused arc
  const arcRefs = useRef<(SVGGElement | null)[]>([])
  const [animate] = useState(() => {
    if (prefersReducedMotion()) return false
    const now = Date.now()
    if (horizonPlayedAt && now - horizonPlayedAt > 1500) return false
    if (!horizonPlayedAt) horizonPlayedAt = now
    return true
  })
  // Once the bloom has played, the clip and the animation class come off entirely, so no
  // rerender, resize, or capture can ever replay it or re-clip the arcs.
  const [settled, setSettled] = useState(!animate)
  useEffect(() => {
    if (!animate) return
    const t = window.setTimeout(() => setSettled(true), 1700)
    return () => window.clearTimeout(t)
  }, [animate])

  // The wide/narrow decision follows the viewport, not the measured box, so a transient
  // reflow (a full-page screen capture, a scrollbar) cannot flip the layout mid-frame.
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 900px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)')
    const on = (e: MediaQueryListEvent) => setNarrow(e.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    let raf = 0
    const ro = new ResizeObserver((obs) => {
      const width = obs[0].contentRect.width
      // ignore transient sub-900 measurements while the viewport itself is wide
      if (!window.matchMedia('(max-width: 900px)').matches && width < 900) return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setW(Math.max(320, Math.round(width))))
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  const models = useMemo(buildModels, [])
  const ranked = useMemo(() => [...models].sort((x, y) => compareAssessments(x.a, y.a)), [models])
  const urgent = ranked.find((m) => !setAside.has(m.e.id)) ?? ranked[0]
  const glowId = urgent.a.standing === 'atRisk' && !setAside.has(urgent.e.id) ? urgent.e.id : null

  // Until the producer moves it, keyboard focus starts on the most urgent arc.
  const focusIdx = focusIdxRaw ?? Math.max(0, models.findIndex((m) => m.e.id === urgent.e.id))

  // geometry
  const H = Math.min(660, Math.max(480, Math.round(w * 0.58)))
  const O = { x: PAD_LEFT, y: H - PAD_BOTTOM }
  const rMax = Math.min((O.y - PAD_TOP) / Math.sin(rad(A_END)), (w - PAD_RIGHT - O.x) / Math.cos(rad(A0)))
  const rMin = Math.max(140, 0.32 * rMax)
  const rs = radii(models, rMin, rMax)

  const pt = (r: number, aDeg: number): [number, number] => {
    const t = rad(aDeg)
    return [O.x + r * Math.cos(t), O.y - r * Math.sin(t)]
  }
  const arcPath = (r: number, a1: number, a2: number): string => {
    if (a2 <= a1) return ''
    const [x1, y1] = pt(r, a1)
    const [x2, y2] = pt(r, a2)
    return `M ${x1} ${y1} A ${r} ${r} 0 0 0 ${x2} ${y2}`
  }
  const wedgePath = (rIn: number, rOut: number, a1: number, a2: number): string => {
    if (a2 <= a1) return ''
    const [ix1, iy1] = pt(rIn, a1)
    const [ix2, iy2] = pt(rIn, a2)
    const [ox2, oy2] = pt(rOut, a2)
    const [ox1, oy1] = pt(rOut, a1)
    return `M ${ix1} ${iy1} A ${rIn} ${rIn} 0 0 0 ${ix2} ${iy2} L ${ox2} ${oy2} A ${rOut} ${rOut} 0 0 1 ${ox1} ${oy1} Z`
  }

  const activeModel = hoverId
    ? models.find((m) => m.e.id === hoverId)
    : focused
      ? models[focusIdx]
      : null
  const readout = activeModel ?? urgent
  const hasCursor = activeModel != null

  const focusArc = (idx: number) => {
    const next = (idx + models.length) % models.length
    setFocusIdx(next)
    setCursorDay(null)
    arcRefs.current[next]?.focus()
  }

  const onArcKey = (ev: ReactKeyboardEvent, idx: number, m: ArcModel) => {
    const k = ev.key
    if (k === 'j' || k === 'J' || k === 'ArrowUp') {
      ev.preventDefault()
      focusArc(idx - 1) // inward, toward the sooner ring
    } else if (k === 'k' || k === 'K' || k === 'ArrowDown') {
      ev.preventDefault()
      focusArc(idx + 1)
    } else if (k === 'Enter' || k === ' ') {
      ev.preventDefault()
      onOpen(m.e.id)
    } else if (k === 's' || k === 'S') {
      ev.preventDefault()
      onSetAside(m.e.id)
    } else if (k === 'ArrowRight' || k === 'ArrowLeft') {
      ev.preventDefault()
      const step = k === 'ArrowRight' ? 1 : -1
      const from = cursorDay ?? 0
      const next = Math.min(m.e.showDaysFromToday, Math.max(m.e.kickoffDaysFromToday, from + step))
      setCursorDay(next)
    } else if (k === 'Home') {
      ev.preventDefault()
      setCursorDay(m.e.kickoffDaysFromToday)
    } else if (k === 'End') {
      ev.preventDefault()
      setCursorDay(m.e.showDaysFromToday)
    } else if (k === 'Escape') {
      ev.preventDefault()
      setCursorDay(null)
    }
  }

  const cursorAnnounce = (() => {
    if (cursorDay == null || !focused) return ''
    const m = models[focusIdx]
    const span = m.e.showDaysFromToday - m.e.kickoffDaysFromToday
    const dayIn = cursorDay - m.e.kickoffDaysFromToday
    const side = cursorDay <= 0 ? 'elapsed' : 'still to build'
    const lock = m.e.locks.find((l) => l.daysFromToday === cursorDay)
    return `${dateLabel(cursorDay)}, day ${dayIn} of ${span}, ${side}${lock ? `. ${lock.label} ${lock.locked ? 'locked' : 'not locked'}` : ''}`
  })()

  // ---------- narrow: linear runway rows, same reading ----------
  if (narrow) {
    return (
      <div ref={wrapRef}>
        <Countdown model={readout} />
        <div role="list" aria-label="Six events by urgency">
          {ranked.map((m) => (
            <RunwayRow key={m.e.id} model={m} glow={m.e.id === glowId} onOpen={onOpen} />
          ))}
        </div>
      </div>
    )
  }

  const bloomR = rMax + 40

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <svg
        className={`horizon-svg${animate && !settled ? ' animate' : ''}${hasCursor ? ' has-cursor' : ''}`}
        viewBox={`0 0 ${w} ${H}`}
        width={w}
        height={H}
        role="group"
        aria-label="The horizon, six events by time left and readiness"
      >
        <defs>
          <pattern id="hz-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#6e6459" strokeWidth="1" opacity="0.3" />
          </pattern>
          <filter id="hz-glow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="6.5" />
          </filter>
          <filter id="hz-cone" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <clipPath id="hz-bloom">
            <circle
              className="bloom-circle"
              cx={O.x}
              cy={O.y}
              r={bloomR}
              style={{ ['--bloom-r' as string]: `${bloomR}px` }}
            />
          </clipPath>
        </defs>

        <g clipPath={settled ? undefined : 'url(#hz-bloom)'}>
          {models.map((m, i) => {
            const r = rs[i]
            const rReady = r - READY_INSET
            const isActive = activeModel?.e.id === m.e.id
            const isUrgent = m.e.id === urgent.e.id
            const glow = m.e.id === glowId
            const aside = setAside.has(m.e.id)
            const showDayNum = isUrgent || isActive
            const [hx, hy] = pt(r, m.headAngle)
            const tangent = [-Math.sin(rad(m.headAngle)), -Math.cos(rad(m.headAngle))]
            const headR = glow ? 7 : 5.5
            const wedge = wedgePath(rReady, r, m.readyAngle, m.headAngle)
            // kickoff-end name labels stagger across two baselines so they never collide
            const labelAt = pt(r, A0)
            const labelDy = i % 2 === 0 ? 22 : 40
            const dayAt = pt(r + 20, m.headAngle)
            const cursorTick =
              focused && focusIdx === i && cursorDay != null
                ? A0 + clamp01((cursorDay - m.e.kickoffDaysFromToday) / (m.e.showDaysFromToday - m.e.kickoffDaysFromToday)) * SWEEP
                : null

            return (
              <g
                key={m.e.id}
                ref={(el) => {
                  arcRefs.current[i] = el
                }}
                className={`arc${isActive ? ' is-active' : ''}`}
                style={aside ? { opacity: 0.3 } : undefined}
                tabIndex={focusIdx === i ? 0 : -1}
                role="button"
                aria-label={`${m.e.name}, ${m.daysLeft} days to show, ${Math.round(m.e.readiness * 100)} percent ready, ${STANDING_WORD[m.a.standing].toLowerCase()}${m.a.behindButNormal ? ', behind but normal' : ''}${aside ? ', set aside' : ''}`}
                onClick={() => onOpen(m.e.id)}
                onKeyDown={(ev) => onArcKey(ev, i, m)}
                onFocus={() => {
                  setFocused(true)
                  setFocusIdx(i)
                }}
                onBlur={() => {
                  setFocused(false)
                  setCursorDay(null)
                }}
                onMouseEnter={() => setHoverId(m.e.id)}
                onMouseLeave={() => setHoverId(null)}
              >
                {/* hatched baseline: where this client normally sits */}
                {m.baseAngle > A0 && (
                  <path d={arcPath(rReady, A0, m.baseAngle)} fill="none" stroke="url(#hz-hatch)" strokeWidth={10} />
                )}
                {/* the readiness gap, the trouble */}
                {wedge && <path d={wedge} fill={m.color} opacity={0.12} />}
                {/* readiness, the load-bearing line */}
                <path d={arcPath(rReady, A0, m.readyAngle)} fill="none" stroke={m.color} strokeWidth={3} strokeLinecap="round" />
                <circle cx={pt(rReady, m.readyAngle)[0]} cy={pt(rReady, m.readyAngle)[1]} r={3.5} fill="#6e6459" />
                {/* the timeline: quiet solid past, dashed runway ahead */}
                <path d={arcPath(r, A0, m.headAngle)} fill="none" stroke={m.color} strokeWidth={1.75} opacity={0.5} strokeLinecap="round" />
                <path d={arcPath(r, m.headAngle, A_END)} fill="none" stroke={m.color} strokeWidth={2.25} strokeLinecap="round" strokeDasharray="3 8" />
                {/* cursor caret while walking days */}
                {cursorTick != null && (
                  <line
                    x1={pt(r - 7, cursorTick)[0]}
                    y1={pt(r - 7, cursorTick)[1]}
                    x2={pt(r + 7, cursorTick)[0]}
                    y2={pt(r + 7, cursorTick)[1]}
                    stroke="#a55a14"
                    strokeWidth={2}
                  />
                )}
                {/* the one glow: halo plus a cone thrown forward into the runway */}
                {glow && (
                  <g className="head-group" style={animate ? { animationDelay: `${(r / rMax) * 620 + 580}ms` } : undefined}>
                    {[
                      { len: 26, half: 6, op: 0.26 },
                      { len: 30, half: 10, op: 0.15 },
                      { len: 34, half: 14, op: 0.07 },
                    ].map((c, ci) => {
                      const base = Math.atan2(tangent[1], tangent[0])
                      const e1 = [hx + c.len * Math.cos(base - rad(c.half)), hy + c.len * Math.sin(base - rad(c.half))]
                      const e2 = [hx + c.len * Math.cos(base + rad(c.half)), hy + c.len * Math.sin(base + rad(c.half))]
                      return (
                        <path
                          key={ci}
                          d={`M ${hx} ${hy} L ${e1[0]} ${e1[1]} L ${e2[0]} ${e2[1]} Z`}
                          fill="#e08a2e"
                          opacity={c.op}
                          filter="url(#hz-cone)"
                        />
                      )
                    })}
                    <circle cx={hx} cy={hy} r={6} fill="#e08a2e" filter="url(#hz-glow)" />
                  </g>
                )}
                {/* the crisp head */}
                <g className="head-group" style={animate ? { animationDelay: `${(r / rMax) * 620}ms` } : undefined}>
                  <circle cx={hx} cy={hy} r={headR} fill={m.color} stroke="#f7f6f4" strokeWidth={1.5} />
                </g>
                {/* the live day number rides the head of the urgent and active arcs */}
                {showDayNum && !m.landed && (
                  <text className="arc-daynum" x={dayAt[0]} y={dayAt[1] + 4} textAnchor={m.headAngle > 45 ? 'middle' : 'start'}>
                    {m.daysLeft}d
                  </text>
                )}
                {m.landed && isActive && (
                  <text className="arc-note" x={dayAt[0]} y={dayAt[1] + 4} textAnchor="middle">
                    landed
                  </text>
                )}
                {/* name at the kickoff end, staggered on two baselines, tied by a faint leader */}
                <line
                  x1={labelAt[0]}
                  y1={labelAt[1] + 6}
                  x2={labelAt[0]}
                  y2={labelAt[1] + labelDy - 12}
                  stroke="#a49a8e"
                  strokeWidth={1}
                  opacity={0.5}
                />
                <text className="arc-label" x={labelAt[0]} y={labelAt[1] + labelDy} textAnchor="middle">
                  {m.e.client}
                </text>
                {/* visible focus ring */}
                {focused && focusIdx === i && (
                  <path d={arcPath(r + 6, A0, A_END)} fill="none" stroke="#a55a14" strokeWidth={1.5} opacity={0.8} />
                )}
                {/* fat transparent hit target */}
                <path d={arcPath(r, A0, A_END)} fill="none" stroke="transparent" strokeWidth={26} />
              </g>
            )
          })}
        </g>

        <Countdown model={readout} svg origin={O} />
      </svg>

      <div className="horizon-readout" aria-hidden="true">
        <div className="eyebrow">{readout.e.id === urgent.e.id ? 'Chase first' : 'Reading'}</div>
        <div className="readout-name">{readout.e.client}</div>
        <div className="readout-what">{readout.e.name.replace(`${readout.e.client} `, '')}</div>
        <div className="readout-line">{readoutLine(readout)}</div>
        <div className="readout-facts">
          <span>
            show <b>{dateLabel(readout.e.showDaysFromToday)}</b>
          </span>
          <span>
            ready <b>{Math.round(readout.e.readiness * 100)}%</b>
          </span>
          <span>
            standing <b>{STANDING_WORD[readout.a.standing]}</b>
          </span>
        </div>
      </div>

      <div className="sr-only" aria-live="polite">
        {cursorAnnounce}
      </div>
    </div>
  )
}

function readoutLine(m: ArcModel): string {
  if (m.landed) return 'Landed. Teardown and final invoices are what remain.'
  if (m.a.tooNew) return `${m.daysLeft} days out with almost nothing logged yet, so this read is soft.`
  if (m.a.behindButNormal) return `Behind, but exactly as ${m.e.client} always runs. Nothing moved this week.`
  if (m.a.standing === 'onTrack') return 'Inside its guardrails. Readiness is running ahead of the clock.'
  const missed = m.e.locks.find((l) => l.daysFromToday < 0 && !l.locked)
  if (missed) {
    return `The ${missed.label.toLowerCase()} passed ${Math.abs(missed.daysFromToday)} ${
      Math.abs(missed.daysFromToday) === 1 ? 'day' : 'days'
    } ago and is still open, and ${driverReason(m.e, m.a)}.`
  }
  return `${capitalize(driverReason(m.e, m.a))}.`
}

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

/** The countdown, dot matrix, day count only. In SVG it sits in the cup inside the rings. */
function Countdown({ model, svg, origin }: { model: ArcModel; svg?: boolean; origin?: { x: number; y: number } }) {
  const days = model.daysLeft
  if (svg && origin) {
    // sits under the shared origin, outside every ring, so any digit count is clear
    return (
      <g aria-hidden="true">
        <text className="count-num" x={origin.x - 6} y={origin.y + 62} fontSize={78}>
          {days}
        </text>
        <text className="count-label" x={origin.x - 4} y={origin.y + 84}>
          {model.landed ? `${model.e.client} landed` : `days to ${model.e.client}`}
        </text>
      </g>
    )
  }
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '8px 8px 16px' }} aria-hidden="true">
      <span style={{ fontFamily: 'var(--font-count)', fontWeight: 700, fontSize: 44, lineHeight: 1 }}>{days}</span>
      <span className="eyebrow">days to {model.e.client}</span>
    </div>
  )
}

/** One event as a linear runway bar, the same reading reflowed for narrow screens. */
function RunwayRow({ model: m, glow, onOpen }: { model: ArcModel; glow: boolean; onOpen: (id: string) => void }) {
  const W = 560
  const HH = 44
  const x0 = 8
  const x1 = W - 16
  const span = x1 - x0
  const headX = x0 + m.elapsed * span
  const readyX = x0 + clamp01(m.e.readiness) * span
  const baseX = x0 + clamp01(m.elapsed - m.e.normal.readinessGap) * span
  const yTop = 16
  const yLow = 32

  return (
    <button className="runway-row" onClick={() => onOpen(m.e.id)}>
      <div className="runway-head">
        <span className="runway-name">{m.e.name}</span>
        <span className="runway-days">{m.landed ? 'landed' : `${m.daysLeft}d`}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${HH}`} width="100%" height={HH} aria-hidden="true" style={{ display: 'block', marginTop: 4 }}>
        <defs>
          <pattern id={`rw-hatch-${m.e.id}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#6e6459" strokeWidth="1" opacity="0.3" />
          </pattern>
        </defs>
        {readyX < headX && <rect x={readyX} y={yTop} width={headX - readyX} height={yLow - yTop} fill={m.color} opacity={0.12} />}
        <line x1={x0} y1={yTop} x2={headX} y2={yTop} stroke={m.color} strokeWidth={1.5} opacity={0.55} strokeLinecap="round" />
        <line x1={headX} y1={yTop} x2={x1} y2={yTop} stroke={m.color} strokeWidth={2} strokeDasharray="2.5 7" strokeLinecap="round" />
        {baseX > x0 && <rect x={x0} y={yLow - 5} width={baseX - x0} height={10} fill={`url(#rw-hatch-${m.e.id})`} />}
        <line x1={x0} y1={yLow} x2={readyX} y2={yLow} stroke={m.color} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={readyX} cy={yLow} r={3} fill="#6e6459" />
        {glow && <circle cx={headX} cy={yTop} r={6} fill="#e08a2e" opacity={0.65} />}
        <circle cx={headX} cy={yTop} r={4.5} fill={m.color} stroke="#f7f6f4" strokeWidth={1.5} />
      </svg>
    </button>
  )
}
