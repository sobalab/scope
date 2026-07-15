import { useEffect, useMemo, useState } from 'react'
import type { EventRecord } from '../domain/types.ts'
import type { Assessment } from '../domain/standing.ts'
import { events } from '../data/events.ts'
import { assess, compareAssessments, isChaseable } from '../domain/standing.ts'
import { elapsedFraction, clamp01 } from '../domain/signals.ts'
import { morningRead } from '../ai/compose.ts'
import { useStream, armFailure } from '../ai/useStream.ts'
import { Streamed } from '../shared/Streamed.tsx'
import { StandingChip } from '../shared/StandingChip.tsx'
import { STANDING_COLOR } from '../shared/standing.ts'
import { dateLabel } from '../lib/dates.ts'
import { eventPath, useRouter } from '../router.tsx'
import { showToast, toggleSetAside, useArdentStore } from '../store.ts'
import { Horizon } from './Horizon.tsx'
import { Toast } from '../shared/Toast.tsx'

// Remembers the last opened event so its row reads as selected on return.
let lastOpened: string | null = null

const SHORTCUTS: { keys: string; does: string }[] = [
  { keys: 'J / K', does: 'move between arcs, inner to outer' },
  { keys: 'Enter', does: 'open the focused event' },
  { keys: 'Arrows', does: 'walk day by day along a focused arc' },
  { keys: 'S', does: 'set the focused event aside until tomorrow' },
  { keys: 'Esc', does: 'close this sheet, or clear the day cursor' },
  { keys: '?', does: 'show this sheet' },
  { keys: '!', does: 'make the next written response fail, for the demo' },
]

function ShortcutSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="sheet-scrim" onClick={onClose} role="dialog" aria-label="Keyboard shortcuts">
      <div className="card sheet" onClick={(e) => e.stopPropagation()}>
        <h2>Keyboard</h2>
        <div style={{ marginTop: 12 }}>
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="sheet-row">
              <span>{s.does}</span>
              <kbd>{s.keys}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BoardSkeleton() {
  return (
    <div className="page" aria-hidden="true">
      <header className="masthead">
        <div>
          <div className="wordmark">Ardent</div>
          <div className="masthead-sub">Production board</div>
        </div>
      </header>
      <div style={{ height: 460, display: 'flex', alignItems: 'flex-end', padding: '0 8px 24px' }}>
        <div style={{ width: '60%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[82, 64, 46].map((w) => (
            <div key={w} className="skeleton-line" style={{ width: `${w}%`, height: 10 }} />
          ))}
        </div>
      </div>
      <div className="read-block">
        <div className="skeleton-line" style={{ width: '58%' }} />
      </div>
      <div className="ledger">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton-line" style={{ height: 40, margin: '20px 16px', borderRadius: 10 }} />
        ))}
      </div>
    </div>
  )
}

/*
  The runway strip: an arc flattened into a row. Solid behind the head, dashed ahead,
  the readiness line below with the client's normal hatched behind it, the gap tinted.
  Only the at-risk head is lit.
*/
function RunwayStrip({ e, a, lit }: { e: EventRecord; a: Assessment; lit: boolean }) {
  const color = STANDING_COLOR[a.standing]
  const elapsed = elapsedFraction(e)
  const ready = clamp01(e.readiness)
  const base = clamp01(elapsed - e.normal.readinessGap)
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`
  return (
    <div className="strip" aria-hidden="true">
      {ready < elapsed && (
        <div className="strip-gap" style={{ left: pct(ready), width: pct(elapsed - ready), background: color }} />
      )}
      <div className="strip-time">
        <div className="strip-time-solid" style={{ width: pct(elapsed), background: color }} />
        <div className="strip-time-ahead" style={{ left: pct(elapsed), width: pct(1 - elapsed), background: color }} />
      </div>
      {base > 0.005 && <div className="strip-hatch" style={{ width: pct(base) }} />}
      <div className="strip-ready" style={{ width: pct(ready), background: color }} />
      <div className={`strip-head${lit ? ' is-lit' : ''}`} style={{ left: pct(elapsed), background: lit ? 'var(--accent)' : color }} />
    </div>
  )
}

export function Board() {
  const { navigate } = useRouter()
  const { setAside, toast } = useArdentStore()
  const [ready, setReady] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [readVersion, setReadVersion] = useState(0)

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 520)
    return () => window.clearTimeout(t)
  }, [])

  // The morning read recomposes when the producer sets something aside.
  const asideKey = [...setAside].sort().join(',')
  const read = useStream(() => morningRead(new Set(setAside)), [asideKey, readVersion])

  const ranked = useMemo(
    () =>
      events
        .map((e) => ({ e, a: assess(e) }))
        .sort((x, y) => compareAssessments(x.a, y.a)),
    [],
  )

  const chase = ranked.find((m) => isChaseable(m.a.standing) && !setAside.has(m.e.id))
  const quiet = !chase
  const litId = chase && chase.a.standing === 'atRisk' ? chase.e.id : null

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const target = ev.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (ev.key === '?') {
        ev.preventDefault()
        setSheet((s) => !s)
      } else if (ev.key === 'Escape' && sheet) {
        setSheet(false)
      } else if (ev.key === '!') {
        armFailure()
        setReadVersion((v) => v + 1)
        showToast('The next written response will fail, so you can see the error state.')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sheet])

  const open = (id: string) => {
    lastOpened = id
    navigate(eventPath(id))
  }

  if (!ready) return <BoardSkeleton />

  return (
    <div className="page">
      <header className="masthead">
        <div>
          <h1 className="wordmark">Ardent</h1>
          <div className="masthead-sub">Production board</div>
        </div>
        <div className="masthead-date">Tuesday, Jul 14</div>
      </header>

      <section className="horizon-stage" aria-label="The horizon">
        <Horizon
          onOpen={open}
          setAside={setAside}
          onSetAside={(id) => {
            const m = ranked.find((x) => x.e.id === id)
            if (m) toggleSetAside(id, m.e.name)
          }}
        />
      </section>

      <section className="read-block" aria-label="The morning read">
        <h2 className="eyebrow">The morning read</h2>
        {quiet && read.done ? (
          <>
            <p className="quiet-line">Nothing to chase today, everything is inside its guardrails.</p>
            <p className="quiet-sub">
              The nearest open lock is {nearestLockPhrase(setAside)}. Set-aside events come back tomorrow morning.
            </p>
          </>
        ) : (
          <Streamed stream={read} lines={3} className="read-text" />
        )}
      </section>

      <section aria-label="Six events" style={{ marginTop: 56 }}>
        <h2 className="eyebrow">Six events, soonest bite first</h2>
        <div className="ledger">
          {ranked.map(({ e, a }) => {
            const aside = setAside.has(e.id)
            return (
              <button
                key={e.id}
                className={`ledger-row${lastOpened === e.id ? ' is-selected' : ''}${aside ? ' is-aside' : ''}`}
                onClick={() => open(e.id)}
                aria-label={`${e.name}, show ${dateLabel(e.showDaysFromToday)}, ${Math.round(e.readiness * 100)} percent ready${aside ? ', set aside' : ''}`}
              >
                <span>
                  <span className="lr-who">{e.client}</span>
                  <span className="lr-what" style={{ display: 'block' }}>
                    {e.name.replace(`${e.client} `, '')}, {dateLabel(e.showDaysFromToday)}
                  </span>
                  {aside && <span className="lr-aside">set aside until tomorrow</span>}
                </span>
                <RunwayStrip e={e} a={a} lit={e.id === litId && !aside} />
                <span className="lr-days">
                  <span className="lr-count">{Math.max(0, e.showDaysFromToday)}</span>
                  <span className="lr-unit">{e.phase === 'teardown' ? 'landed' : 'days'}</span>
                </span>
                <span className="lr-standing">
                  <StandingChip standing={a.standing} />
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {toast && <Toast toast={toast} />}
      {sheet && <ShortcutSheet onClose={() => setSheet(false)} />}
    </div>
  )
}

function nearestLockPhrase(setAside: ReadonlySet<string>): string {
  let best: { label: string; days: number; client: string } | null = null
  for (const e of events) {
    if (setAside.has(e.id)) continue
    for (const l of e.locks) {
      if (l.locked || l.daysFromToday < 0) continue
      if (!best || l.daysFromToday < best.days) best = { label: l.label, days: l.daysFromToday, client: e.client }
    }
  }
  if (!best) return 'weeks out'
  return `${best.client}'s ${best.label.toLowerCase()} in ${best.days} days`
}
