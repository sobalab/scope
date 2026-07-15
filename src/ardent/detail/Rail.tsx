import { useState } from 'react'
import type { EventRecord, SignalKind } from '../domain/types.ts'
import { SIGNAL_ORDER } from '../domain/types.ts'
import type { Assessment } from '../domain/standing.ts'
import { signalsFor } from '../domain/signals.ts'
import { ask, starters } from '../ai/compose.ts'
import { useStream } from '../ai/useStream.ts'
import { Streamed } from '../shared/Streamed.tsx'
import { STANDING_COLOR } from '../shared/standing.ts'
import { showToast, toggleSetAside } from '../store.ts'

const SIGNAL_NAME: Record<SignalKind, string> = {
  readiness: 'Readiness',
  waiting: 'Waiting on',
  budget: 'Budget',
  crew: 'Crew',
}

/*
  The four signals. Each track shows where the signal stands now (the solid bar), with the
  client's normal range hatched behind it, so behind-but-normal reads at a glance. The
  movement word says which way it went this week.
*/
export function SignalsPanel({ event, assessment }: { event: EventRecord; assessment: Assessment }) {
  const signals = signalsFor(event)
  return (
    <section className="panel">
      <h2 className="panel-title">The four signals</h2>
      {SIGNAL_ORDER.map((k) => {
        const s = signals[k]
        const worse = s.now > s.lastWeek + 0.04
        const eased = s.now < s.lastWeek - 0.04
        // A signal sitting where this client always sits is not news, even if it drifted.
        const asUsual = s.now - s.baseline < 0.1
        const move = worse && !asUsual ? 'up this week' : eased ? 'eased this week' : asUsual && s.now >= 0.3 ? 'as usual' : 'steady'
        const color = STANDING_COLOR[assessment.standing === 'tooNew' ? 'tooNew' : assessment.standing]
        return (
          <div key={k} className="signal">
            <div className="signal-head">
              <span className="signal-name">{SIGNAL_NAME[k]}</span>
              <span className={`signal-move${worse && !asUsual ? ' is-worse' : ''}`}>{move}</span>
            </div>
            <div
              className="signal-track"
              role="img"
              aria-label={`${SIGNAL_NAME[k]}: concern ${Math.round(s.now * 100)} of 100, usually ${Math.round(s.baseline * 100)} for this client, ${move}`}
            >
              <div className="signal-hatch" style={{ width: `${Math.round(s.baseline * 100)}%` }} />
              <div className="signal-now" style={{ width: `${Math.max(2, Math.round(s.now * 100))}%`, background: color, opacity: 0.85 }} />
            </div>
            <div className="signal-facts">
              {s.facts.map((f) => (
                <span key={f.label}>
                  {f.label} <b>{f.value}</b>
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </section>
  )
}

const money = (n: number): string => `$${Math.round(n / 1000)}k`

export function BudgetPanel({ event }: { event: EventRecord }) {
  const { cap, committed, spent } = event.budget
  const unspent = committed - spent
  return (
    <section className="panel">
      <h2 className="panel-title">Budget against committed</h2>
      <div className="money-row">
        <div className="money-label">
          <span>Committed</span>
          <b>
            {money(committed)} of {money(cap)}
          </b>
        </div>
        <div className="money-track">
          <div
            className="money-fill"
            style={{
              width: `${Math.min(100, Math.round((committed / cap) * 100))}%`,
              background: committed / cap > 0.95 ? 'var(--behind)' : 'var(--muted)',
            }}
          />
        </div>
      </div>
      <div className="money-row">
        <div className="money-label">
          <span>Spent</span>
          <b>{money(spent)}</b>
        </div>
        <div className="money-track">
          <div className="money-fill" style={{ width: `${Math.min(100, Math.round((spent / cap) * 100))}%`, background: 'var(--ink)' }} />
        </div>
      </div>
      <div className="money-callout">
        {money(unspent)} committed but unspent. Deposits do not come back if anything moves.
      </div>
    </section>
  )
}

export function CrewPanel({ event }: { event: EventRecord }) {
  return (
    <section className="panel">
      <h2 className="panel-title">Crew</h2>
      {event.crew.map((c) => (
        <div key={c.name} className="crew-row">
          <div>
            <div className="crew-name">{c.name}</div>
            <div className="crew-role">{c.role}</div>
            {c.collidesWith && <div className="crew-clash">Also on {c.collidesWith} the same weekend</div>}
          </div>
          <span className="crew-stretch">{Math.round(c.stretch * 100)}%</span>
        </div>
      ))}
    </section>
  )
}

function AskAnswer({ event, assessment, question }: { event: EventRecord; assessment: Assessment; question: string }) {
  const stream = useStream(() => ({ text: ask(event, assessment, question), sources: [] }), [question])
  return <Streamed stream={stream} lines={2} className="ask-answer" />
}

export function AskPanel({ event, assessment }: { event: EventRecord; assessment: Assessment }) {
  const [draft, setDraft] = useState('')
  const [asked, setAsked] = useState<string | null>(null)
  const suggestions = starters(event, assessment)

  return (
    <section className="panel">
      <h2 className="panel-title">Ask about this event</h2>
      <form
        className="ask-form"
        onSubmit={(e) => {
          e.preventDefault()
          if (draft.trim()) setAsked(draft.trim())
        }}
      >
        <input
          className="ask-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Ask about ${event.client}`}
          aria-label={`Ask about ${event.client}`}
        />
        <button className="ask-send" type="submit">
          Ask
        </button>
      </form>
      {asked ? (
        <AskAnswer key={asked} event={event} assessment={assessment} question={asked} />
      ) : (
        <div className="ask-starters">
          {suggestions.map((s) => (
            <button
              key={s}
              className="ask-starter"
              onClick={() => {
                setDraft(s)
                setAsked(s)
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

export function ActionsPanel({ event, isAside }: { event: EventRecord; isAside: boolean }) {
  const pending = event.vendors.find((v) => !v.contracted)
  return (
    <section className="panel">
      <h2 className="panel-title">Actions</h2>
      <button
        className="action primary"
        onClick={() => showToast(`Chase drafted to ${event.client}. Nothing leaves the demo.`)}
      >
        Chase the client <span className="action-hint">email</span>
      </button>
      {pending && (
        <button className="action" onClick={() => showToast(`Chase drafted to ${pending.name}. Nothing leaves the demo.`)}>
          Chase {pending.name} <span className="action-hint">{pending.role.toLowerCase()}</span>
        </button>
      )}
      <button className="action" onClick={() => toggleSetAside(event.id, event.name)}>
        {isAside ? 'Bring it back now' : 'Set aside until tomorrow'} <span className="action-hint">S</span>
      </button>
      <button className="action" onClick={() => showToast('This would open the run sheet in the firm’s tools.')}>
        Open in the firm's tools <span className="action-hint">run sheet</span>
      </button>
    </section>
  )
}
