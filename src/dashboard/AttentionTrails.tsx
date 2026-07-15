import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { AttentionDay, Project } from '../domain/types.ts'
import { assess, compareAssessments } from '../domain/acuity.ts'
import type { Assessment } from '../domain/acuity.ts'
import { isFullySilent, lastActiveIndex } from '../domain/attention.ts'
import { ACUITY_COLOR, ACUITY_SHORT } from './acuity.ts'

/*
  Attention trails. One row per project, 14 days left to right, today pinned right. Each
  active day is an area-proportional dot; the dots ride a single filled ribbon whose
  width is momentum and whose opacity brightens toward the head. When a project goes
  quiet the ribbon ends at its last dot and the bare background runs to the today line.
  That void is the silence, and its width is literally the number of days since anyone
  touched the project. Built to the design spec: measured pixels (only x reflows), a
  cool slate acuity ramp, a load wipe that stops at each head, and full keyboard control.
*/

const PAD_T = 28
const PAD_B = 20
const ROW_H = 44
const GUTTER = 16
const RIGHT_PAD = 24
const RMAX = 8
const RFLOOR = 2
const VMAX = 10
const DAYS = 14

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n))
const radius = (v: number): number => Math.max(RFLOOR, RMAX * Math.sqrt(clamp01(v / VMAX)))

// Causal recency-weighted momentum, so a lone spike reads low and a sustained run reads high.
const momentum = (v: number[], i: number): number =>
  clamp01((0.5 * (v[i] ?? 0) + 0.3 * (v[i - 1] ?? 0) + 0.2 * (v[i - 2] ?? 0)) / VMAX)
const halfWidth = (m: number): number => 0.6 + 2.4 * m

// Catmull-Rom through points, emitted as cubic beziers, for the contrail curve.
function curve(points: [number, number][]): string {
  let d = ''
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? points[i + 1]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += `C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]} `
  }
  return d
}

interface Entry {
  project: Project
  assessment: Assessment
  days: AttentionDay[]
  color: string
  startGlobal: number
  lastGlobal: number
  activeLocals: number[]
  gapDays: number
  silent: boolean
  tooNew: boolean
}

/** row is the entry index. day is a LOCAL index into that entry's days, or null for the row. */
interface Cursor {
  row: number
  day: number | null
}

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface Props {
  projects: Project[]
  attention: Record<string, AttentionDay[]>
  onSelect: (project: Project) => void
  selectedId?: string | null
  state?: 'ready' | 'loading'
}

export function AttentionTrails({ projects, attention, onSelect, selectedId, state = 'ready' }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(880)
  const [hover, setHover] = useState<Cursor | null>(null)
  const [focus, setFocus] = useState<Cursor>({ row: 0, day: null })
  const [focused, setFocused] = useState(false)
  const rowRefs = useRef<(SVGRectElement | null)[]>([])
  const [animate] = useState(() => state === 'ready' && !prefersReducedMotion())
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    if (!animate) return
    const t = window.setTimeout(() => setSettled(true), 1300)
    return () => window.clearTimeout(t)
  }, [animate])

  const entries = useMemo<Entry[]>(() => {
    return projects
      .map((project) => {
        const days = attention[project.id] ?? []
        const a = assess(project)
        const L = days.length
        const startGlobal = DAYS - L
        const localLast = lastActiveIndex(days)
        const silent = isFullySilent(days)
        const activeLocals: number[] = []
        days.forEach((d, j) => {
          if (d.volume > 0) activeLocals.push(j)
        })
        return {
          project,
          assessment: a,
          days,
          color: ACUITY_COLOR[a.acuity],
          startGlobal,
          lastGlobal: localLast < 0 ? -1 : startGlobal + localLast,
          activeLocals,
          gapDays: silent ? DAYS : 13 - (startGlobal + localLast),
          silent,
          tooNew: L < DAYS,
        }
      })
      .sort((x, y) => compareAssessments(x.assessment, y.assessment))
  }, [projects, attention])

  // Keep the roving tabindex valid when the filtered row count shrinks, so the chart
  // never ends up with zero tabbable rows and becomes keyboard-unreachable.
  useEffect(() => {
    setFocus((f) =>
      f.row > entries.length - 1 ? { row: Math.max(0, entries.length - 1), day: null } : f,
    )
  }, [entries.length])

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    let raf = 0
    const ro = new ResizeObserver((obs) => {
      const width = obs[0].contentRect.width
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setW(Math.max(560, Math.round(width))))
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  const rows = entries.length
  const height = PAD_T + rows * ROW_H + PAD_B
  const labelW = Math.min(220, Math.max(150, Math.round(0.22 * w)))
  const x0 = labelW + GUTTER
  const x1 = w - RIGHT_PAD
  const step = (x1 - x0) / (DAYS - 1)
  const x = (d: number): number => x0 + d * step
  const plotTop = PAD_T
  const plotBottom = PAD_T + rows * ROW_H

  const focusRow = (i: number) => {
    const c = Math.min(rows - 1, Math.max(0, i))
    setFocus({ row: c, day: null })
    setHover(null)
    rowRefs.current[c]?.focus()
  }

  const onRowKey = (ev: ReactKeyboardEvent, index: number, entry: Entry) => {
    const k = ev.key
    const actives = entry.activeLocals
    if (focus.day == null) {
      if (k === 'j' || k === 'J' || k === 'ArrowDown') { ev.preventDefault(); focusRow(index + 1) }
      else if (k === 'k' || k === 'K' || k === 'ArrowUp') { ev.preventDefault(); focusRow(index - 1) }
      else if (k === 'Home') { ev.preventDefault(); focusRow(0) }
      else if (k === 'End') { ev.preventDefault(); focusRow(rows - 1) }
      else if (k === 'Enter' || k === ' ') { ev.preventDefault(); onSelect(entry.project) }
      else if (k === 'ArrowRight' && actives.length) {
        ev.preventDefault()
        setFocus({ row: index, day: actives[0] })
        setHover({ row: index, day: actives[0] })
      }
    } else {
      const pos = actives.indexOf(focus.day)
      if (k === 'ArrowRight') {
        ev.preventDefault()
        const next = actives[pos + 1]
        if (next != null) { setFocus({ row: index, day: next }); setHover({ row: index, day: next }) }
      } else if (k === 'ArrowLeft') {
        ev.preventDefault()
        if (pos <= 0) { setFocus({ row: index, day: null }); setHover(null) }
        else { const prev = actives[pos - 1]; setFocus({ row: index, day: prev }); setHover({ row: index, day: prev }) }
      } else if (k === 'Escape') { ev.preventDefault(); setFocus({ row: index, day: null }); setHover(null) }
      else if (k === 'Enter' || k === ' ') { ev.preventDefault(); onSelect(entry.project) }
      else if (k === 'j' || k === 'J' || k === 'ArrowDown') { ev.preventDefault(); focusRow(index + 1) }
      else if (k === 'k' || k === 'K' || k === 'ArrowUp') { ev.preventDefault(); focusRow(index - 1) }
    }
  }

  // Which row and day is the pointer/keyboard cursor on, and its readout.
  const cursor = hover ?? (focused ? focus : null)
  const tip = (() => {
    if (!cursor || cursor.day == null) return null
    const e = entries[cursor.row]
    const note = e?.days[cursor.day]?.note
    if (!note) return null
    const yr = PAD_T + cursor.row * ROW_H + ROW_H / 2
    return { left: x(e.startGlobal + cursor.day), top: yr - radius(e.days[cursor.day].volume) - 12, text: note }
  })()

  if (state === 'loading') {
    return (
      <div className="trails-wrap" ref={wrapRef}>
        <svg width={w} height={height} role="img" aria-label="Loading attention across projects">
          {entries.map((e, i) => {
            const yr = PAD_T + i * ROW_H + ROW_H / 2
            return (
              <g key={e.project.id}>
                <rect x={x0} y={yr - 9} width={x1 - x0} height={18} rx={9} fill="var(--ground-2)" />
                <line x1={x0} y1={yr} x2={x1} y2={yr} stroke="var(--slate)" strokeWidth={1} opacity={0.4} />
              </g>
            )
          })}
        </svg>
      </div>
    )
  }

  return (
    <div className="trails-wrap" ref={wrapRef}>
      <svg
        className={`trails${animate && !settled ? ' animate' : ''}`}
        width={w}
        height={height}
        role="group"
        aria-label={`Attention across ${rows} client projects over the last 14 days`}
      >
        <defs>
          {entries.map((e) => {
            if (e.silent || e.lastGlobal < 0) return null
            const gx1 = x(e.startGlobal + e.activeLocals[0])
            const gx2 = x(e.lastGlobal)
            return (
              <linearGradient key={e.project.id} id={`trail-${e.project.id}`} gradientUnits="userSpaceOnUse" x1={gx1} y1={0} x2={gx2} y2={0}>
                <stop offset="0" stopColor={e.color} stopOpacity={0.14} />
                <stop offset="0.65" stopColor={e.color} stopOpacity={0.5} />
                <stop offset="1" stopColor={e.color} stopOpacity={0.85} />
              </linearGradient>
            )
          })}
          {entries.map((e, i) => {
            const yr = PAD_T + i * ROW_H + ROW_H / 2
            // A silent row has no ribbon to reveal; let the wipe span the row so its label shows.
            const headX = e.lastGlobal < 0 ? x1 : x(e.lastGlobal) + RMAX
            return (
              <clipPath key={e.project.id} id={`wipe-${e.project.id}`}>
                <rect
                  className="wipe-rect"
                  style={{ animationDelay: `${i * 45}ms` }}
                  x={x0}
                  y={yr - ROW_H / 2}
                  width={Math.max(0, headX - x0)}
                  height={ROW_H}
                />
              </clipPath>
            )
          })}
        </defs>

        <text x={x0} y={PAD_T - 12} className="trail-cap" style={{ textAnchor: 'start' }}>14 days ago</text>
        <text x={x1} y={PAD_T - 12} className="trail-cap" style={{ textAnchor: 'end' }}>Today</text>
        <line x1={x1} y1={plotTop} x2={x1} y2={plotBottom} stroke="var(--line-strong)" strokeWidth={1} />

        {entries.map((e, i) => {
          const yr = PAD_T + i * ROW_H + ROW_H / 2
          const dimmed = cursor != null && cursor.row !== i
          const selected = selectedId === e.project.id

          let ribbon = ''
          if (!e.silent && e.activeLocals.length >= 2) {
            const vols = e.days.map((d) => d.volume)
            const first = e.activeLocals[0]
            const last = e.activeLocals[e.activeLocals.length - 1]
            const top: [number, number][] = []
            const bot: [number, number][] = []
            for (let j = first; j <= last; j++) {
              const cx = x(e.startGlobal + j)
              const h = halfWidth(momentum(vols, j))
              top.push([cx, yr - h])
              bot.push([cx, yr + h])
            }
            ribbon =
              `M ${top[0][0]} ${top[0][1]} ` +
              curve(top) +
              `L ${bot[bot.length - 1][0]} ${bot[bot.length - 1][1]} ` +
              curve([...bot].reverse()) +
              'Z'
          }

          return (
            <g
              key={e.project.id}
              className={`trail-row${dimmed ? ' dimmed' : ''}${selected ? ' selected' : ''}`}
              onMouseEnter={() => setHover({ row: i, day: null })}
              onMouseLeave={() => setHover(null)}
            >
              <rect className="row-select" x={x0 - 6} y={yr - ROW_H / 2 + 4} width={x1 - x0 + 12} height={ROW_H - 8} rx={10} />
              {selected && <rect x={labelW - 10} y={yr - 3.5} width={7} height={7} rx={1.5} fill="var(--accent)" />}
              <text className="row-label" x={labelW - 16} y={yr + 4} style={{ textAnchor: 'end' }}>{e.project.client}</text>

              <g clipPath={`url(#wipe-${e.project.id})`}>
                {ribbon && <path d={ribbon} fill={`url(#trail-${e.project.id})`} />}
                {e.activeLocals.map((j) => {
                  const v = e.days[j].volume
                  const cx = x(e.startGlobal + j)
                  const isHead = e.startGlobal + j === e.lastGlobal
                  return (
                    <g key={j}>
                      <circle className="dot" cx={cx} cy={yr} r={radius(v)} fill={e.color} opacity={isHead ? 0.95 : 0.72}
                        style={{ pointerEvents: 'none' }} />
                      {isHead && <circle cx={cx} cy={yr} r={radius(v)} fill="none" stroke="var(--surface)" strokeWidth={2} style={{ pointerEvents: 'none' }} />}
                    </g>
                  )
                })}
                {e.tooNew && !e.silent && (
                  <g style={{ pointerEvents: 'none' }}>
                    <line x1={x(e.startGlobal)} y1={yr - 8} x2={x(e.startGlobal)} y2={yr + 8} stroke="var(--slate)" strokeWidth={1.5} />
                    <circle cx={x(e.startGlobal)} cy={yr} r={2.5} fill="none" stroke="var(--slate)" strokeWidth={1.5} />
                  </g>
                )}
                {e.silent && (
                  <g style={{ pointerEvents: 'none' }}>
                    <circle cx={x0} cy={yr} r={4} fill="none" stroke={e.color} strokeWidth={2} />
                    <text x={x0 + 14} y={yr + 4} className="silent-label">No attention in 14 days</text>
                  </g>
                )}
                {focus.day != null && focus.row === i && (
                  <circle className="focus-ring" cx={x(e.startGlobal + focus.day)} cy={yr}
                    r={radius(e.days[focus.day]?.volume ?? 0) + 3} fill="none" stroke="var(--accent)" strokeWidth={2}
                    style={{ pointerEvents: 'none' }} />
                )}
              </g>

              {cursor?.row === i && cursor.day == null && !e.silent && e.gapDays > 0 && (
                <text x={(x(e.lastGlobal) + x1) / 2} y={yr - 11} className="void-label" style={{ textAnchor: 'middle', pointerEvents: 'none' }}>
                  quiet {e.gapDays} {e.gapDays === 1 ? 'day' : 'days'}
                </text>
              )}

              <rect
                ref={(el) => { rowRefs.current[i] = el }}
                className="row-hit"
                x={0}
                y={yr - ROW_H / 2}
                width={w}
                height={ROW_H}
                fill="transparent"
                tabIndex={focus.row === i ? 0 : -1}
                role="button"
                aria-label={`${e.project.client}, ${e.project.engagement}, ${ACUITY_SHORT[e.assessment.acuity].toLowerCase()}, ${
                  e.silent ? 'no attention in 14 days' : e.gapDays === 0 ? 'active through today' : `quiet ${e.gapDays} days`
                }`}
                onFocus={() => {
                  setFocused(true)
                  setFocus((f) => (f.row === i ? f : { row: i, day: null }))
                }}
                onBlur={() => setFocused(false)}
                onClick={() => onSelect(e.project)}
                onKeyDown={(ev) => onRowKey(ev, i, e)}
              />
              {/* per-dot hit targets sit above the row hit so a mouse reveals that day */}
              {e.activeLocals.map((j) => (
                <circle
                  key={`hit-${j}`}
                  cx={x(e.startGlobal + j)}
                  cy={yr}
                  r={Math.max(radius(e.days[j].volume), 12)}
                  fill="transparent"
                  onMouseEnter={() => setHover({ row: i, day: j })}
                  onMouseLeave={() => setHover({ row: i, day: null })}
                  onClick={() => onSelect(e.project)}
                />
              ))}
            </g>
          )
        })}
      </svg>
      {tip && (
        <div className="trail-tip" style={{ left: tip.left, top: tip.top }}>
          {tip.text}
        </div>
      )}
      <div className="sr-only" aria-live="polite">
        {cursor && cursor.day != null && entries[cursor.row]
          ? `${entries[cursor.row].project.client}, ${entries[cursor.row].days[cursor.day]?.note ?? 'no activity'}`
          : ''}
      </div>
    </div>
  )
}
