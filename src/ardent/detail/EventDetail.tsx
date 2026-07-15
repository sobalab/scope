import { useEffect, useState } from 'react'
import { eventById } from '../data/events.ts'
import type { EventRecord, LockDate, OpenItem } from '../domain/types.ts'
import { assess } from '../domain/standing.ts'
import type { Assessment } from '../domain/standing.ts'
import { whatToWatch } from '../ai/compose.ts'
import { useStream } from '../ai/useStream.ts'
import { Streamed } from '../shared/Streamed.tsx'
import { StandingChip } from '../shared/StandingChip.tsx'
import { Toast } from '../shared/Toast.tsx'
import { dateLabel, dayPhrase } from '../lib/dates.ts'
import { Link, useRouter } from '../router.tsx'
import { toggleSetAside, useArdentStore } from '../store.ts'
import { ActionsPanel, AskPanel, BudgetPanel, CrewPanel, SignalsPanel } from './Rail.tsx'

function BackLink() {
  return (
    <Link to="/" className="backlink">
      <span aria-hidden="true">‹</span> Board
    </Link>
  )
}

function Skeleton() {
  const block = (h: number, w: string) => (
    <div className="skeleton-line" style={{ height: h, width: w, borderRadius: 8 }} />
  )
  return (
    <div className="page" aria-hidden="true">
      <BackLink />
      <div className="detail-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {block(26, '260px')}
          {block(13, '180px')}
        </div>
      </div>
      <div className="detail-grid">
        <div className="work" style={{ gap: 24 }}>
          {block(20, '85%')}
          {block(20, '55%')}
          {block(200, '100%')}
          {block(160, '100%')}
        </div>
        <div className="rail">
          {block(220, '100%')}
          {block(140, '100%')}
          {block(150, '100%')}
        </div>
      </div>
    </div>
  )
}

/* The run to show day: lock dates in order, then show day as a fixed point. */
function RunToShowDay({ event }: { event: EventRecord }) {
  const locks = [...event.locks].sort((a, b) => a.daysFromToday - b.daysFromToday)
  const nodeClass = (l: LockDate): string => {
    if (l.daysFromToday < 0 && !l.locked) return 'is-missed'
    if (l.locked) return 'is-locked'
    return 'is-open'
  }
  return (
    <section>
      <h2 className="sec-title">The run to show day</h2>
      <div className="run">
        {locks.map((l) => {
          const missed = l.daysFromToday < 0 && !l.locked
          return (
            <div key={l.id} className={`run-item${!l.locked ? ' is-open' : ''}`}>
              <div className="run-spine" />
              <div className={`run-node ${nodeClass(l)}`} />
              <div>
                <div className="run-what">{l.label}</div>
                <div className="run-meta">
                  {missed ? (
                    <span className="run-missed">
                      Passed {Math.abs(l.daysFromToday)} {Math.abs(l.daysFromToday) === 1 ? 'day' : 'days'} ago and not
                      locked. If it stays open, {l.breaksIf}.
                    </span>
                  ) : l.locked ? (
                    <>Locked. {l.owner} closed it.</>
                  ) : (
                    <>
                      {l.owner} owns it. Missed means {l.breaksIf}.
                    </>
                  )}
                </div>
              </div>
              <div className="run-when">{dateLabel(l.daysFromToday)}</div>
            </div>
          )
        })}
        <div className="run-item">
          <div className={`run-node is-show`} />
          <div>
            <div className="run-what">Show day</div>
            <div className="run-meta">
              {event.showDaysFromToday < 0
                ? `Happened ${dayPhrase(event.showDaysFromToday)}.`
                : 'The date does not move. Everything above runs backward from here.'}
            </div>
          </div>
          <div className="run-when">{dateLabel(event.showDaysFromToday)}</div>
        </div>
      </div>
    </section>
  )
}

function Vendors({ event }: { event: EventRecord }) {
  if (event.vendors.length === 0) {
    return (
      <section>
        <h2 className="sec-title">Vendors</h2>
        <div className="empty">No vendors engaged yet. The venue shortlist comes first, then this fills in.</div>
      </section>
    )
  }
  return (
    <section>
      <h2 className="sec-title">Vendors</h2>
      {event.vendors.map((v) => {
        const late = !v.contracted && v.lockDaysFromToday <= 5
        return (
          <div key={v.id} className="vendor">
            <span
              className={`vendor-ring ${v.contracted ? 'is-contracted' : 'is-pending'}`}
              aria-hidden="true"
            />
            <div>
              <div className="vendor-name">
                {v.name} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>{v.role}</span>
              </div>
              <div className="vendor-meta">
                {v.contracted ? 'Contracted' : 'Pending'},{' '}
                {v.depositPaid ? 'deposit paid' : <span className="is-out">deposit outstanding</span>}
              </div>
            </div>
            <div className="vendor-lock">
              <div className={late ? 'is-late' : undefined}>locks {dateLabel(v.lockDaysFromToday)}</div>
              <div>{v.lockDaysFromToday < 0 ? (v.contracted ? 'closed' : 'passed') : dayPhrase(v.lockDaysFromToday)}</div>
            </div>
          </div>
        )
      })}
    </section>
  )
}

const GROUPS: { kind: OpenItem['kind']; label: string }[] = [
  { kind: 'blocker', label: 'Blockers' },
  { kind: 'risk', label: 'Risks' },
  { kind: 'question', label: 'Open questions' },
]

function OpenItems({ event }: { event: EventRecord }) {
  const open = event.openItems
  if (open.length === 0) {
    return (
      <section>
        <h2 className="sec-title">Open items</h2>
        <div className="empty">Nothing open. No blockers, no risks, and no questions waiting on anyone. Good news.</div>
      </section>
    )
  }
  return (
    <section>
      <h2 className="sec-title">Open items</h2>
      {GROUPS.map((g) => {
        const items = open.filter((o) => o.kind === g.kind).sort((a, b) => b.ageDays - a.ageDays)
        if (!items.length) return null
        return (
          <div key={g.kind} className="items-group">
            <div className="items-label">{g.label}</div>
            {items.map((o) => (
              <div key={o.id} className="item">
                <div className={`item-age${o.ageDays >= 5 ? ' is-old' : ''}`}>
                  {o.ageDays}
                  <span>{o.ageDays === 1 ? 'day' : 'days'}</span>
                </div>
                <div>
                  <div className="item-title">{o.title}</div>
                  <div className="item-owner">
                    Waiting on {o.owner}
                    {o.onClient ? ', the client side' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </section>
  )
}

function ActivityFeed({ event }: { event: EventRecord }) {
  const byDay = new Map<number, typeof event.activity>()
  for (const a of [...event.activity].sort((x, y) => x.daysAgo - y.daysAgo)) {
    const list = byDay.get(a.daysAgo)
    if (list) list.push(a)
    else byDay.set(a.daysAgo, [a])
  }
  const days = [...byDay.keys()]
  return (
    <section>
      <h2 className="sec-title">Recent activity</h2>
      {days.map((d) => (
        <div key={d} className="act-day">
          <div className="act-when">{d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d} days ago`}</div>
          {byDay.get(d)!.map((a) => (
            <div key={a.id} className="act-line">
              <span>{a.text}</span>
              <span className="act-who">{a.who}</span>
            </div>
          ))}
        </div>
      ))}
    </section>
  )
}

function WhatToWatch({ event, assessment }: { event: EventRecord; assessment: Assessment }) {
  const stream = useStream(() => whatToWatch(event, assessment), [event.id])
  return (
    <section>
      <h2 className="sec-title">What to watch</h2>
      <Streamed stream={stream} lines={2} className="watch-line" />
    </section>
  )
}

export function EventDetail({ id }: { id: string }) {
  const { navigate } = useRouter()
  const { setAside, toast } = useArdentStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 340)
    return () => window.clearTimeout(t)
  }, [id])

  const event = eventById(id)

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const target = ev.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (ev.key === 'Escape') navigate('/')
      else if ((ev.key === 's' || ev.key === 'S') && event) toggleSetAside(event.id, event.name)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, event])

  if (!event) {
    return (
      <div className="page">
        <BackLink />
        <div className="detail-head">
          <h1 className="detail-title">No such event</h1>
        </div>
        <p style={{ color: 'var(--muted)' }}>There is no event at this address. It may have wrapped and been archived.</p>
      </div>
    )
  }

  if (loading) return <Skeleton />

  const assessment = assess(event)
  const isAside = setAside.has(event.id)

  return (
    <div className="page">
      <BackLink />
      <div className="detail-head">
        <div>
          <h1 className="detail-title">{event.name}</h1>
          <div className="detail-sub">
            {event.guests ? `${event.guests} guests, ` : ''}show {dateLabel(event.showDaysFromToday)},{' '}
            {dayPhrase(event.showDaysFromToday)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {assessment.behindButNormal && <span className="marker">Behind but normal</span>}
          {isAside && <span className="marker">Set aside</span>}
          <StandingChip standing={assessment.standing} />
        </div>
      </div>

      {isAside && (
        <div className="detail-note">Set aside. It comes back tomorrow morning. Press S to bring it back now.</div>
      )}
      {event.phase === 'teardown' && !isAside && (
        <div className="detail-note">This one landed. Teardown and final invoicing are what remain, not triage.</div>
      )}

      <div className="detail-grid">
        <div className="work">
          <WhatToWatch event={event} assessment={assessment} />
          <RunToShowDay event={event} />
          <Vendors event={event} />
          <OpenItems event={event} />
          <ActivityFeed event={event} />
        </div>
        <div className="rail">
          <SignalsPanel event={event} assessment={assessment} />
          <BudgetPanel event={event} />
          <CrewPanel event={event} />
          <AskPanel event={event} assessment={assessment} />
          <ActionsPanel event={event} isAside={isAside} />
        </div>
      </div>

      {toast && <Toast toast={toast} />}
    </div>
  )
}
