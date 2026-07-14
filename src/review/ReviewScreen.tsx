import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Avatar } from './components/Avatar.tsx'
import { Badge } from './components/Badge.tsx'
import type { BadgeTone } from './components/Badge.tsx'
import { Button } from './components/Button.tsx'
import { Tag } from './components/Tag.tsx'
import { GlassPanel } from './components/GlassPanel.tsx'
import { SpectrumScore } from './components/SpectrumScore.tsx'

/*
  The flagship surface: a reviewer reading one design-challenge submission and
  recording a decision. Implemented from the design project's
  ui_kits/submission-review/index.html, composed from the ported system primitives.

  States: loading (skeleton) then the shell rises in, reviewing (scorecard + note +
  recommendation), and decided (the dock collapses to a verdict banner that also
  shows the final scores on the system's SpectrumScore; "change decision" reopens it).
*/

type Tab = 'Preview' | 'Readme' | 'Approach'
type Decision = 'advance' | 'maybe' | 'reject'
type CritKey = 'CODE' | 'APPROACH' | 'COMMS' | 'PRODUCT'

const CRIT: { k: CritKey; l: string }[] = [
  { k: 'CODE', l: 'Code quality' },
  { k: 'APPROACH', l: 'Problem approach' },
  { k: 'COMMS', l: 'Communication' },
  { k: 'PRODUCT', l: 'Product sense' },
]
const TABS: Tab[] = ['Preview', 'Readme', 'Approach']
const STACK = ['React', 'TypeScript', 'tRPC', 'Postgres']

const DECMAP: Record<Decision, { tone: BadgeTone; label: string; t: string }> = {
  advance: { tone: 'ink', label: 'Advanced', t: 'Advanced to next round' },
  maybe: { tone: 'accent', label: 'Maybe', t: 'Marked as maybe' },
  reject: { tone: 'neutral', label: 'Rejected', t: 'Rejected' },
}

const CANDIDATE = {
  initials: 'JR',
  name: 'Jordan Reyes',
  role: 'Senior frontend · realtime dashboard challenge',
  submitted: 'Jul 8, 2026',
  url: 'jr-dash.vercel.app',
}

const README_LINES = [44, 92, 84, 60, 78]
const APPROACH_TEXT =
  "Built the realtime layer on tRPC subscriptions with an optimistic cache. Documented the trade-off against Server-Sent Events, and why the dashboard's write volume made subscriptions the safer bet under load."

function Stage({ children }: { children: ReactNode }) {
  return <div className="review-stage">{children}</div>
}

function Skeleton() {
  return (
    <div className="shell pulse" aria-hidden="true">
      <div className="rv-hd">
        <div className="ident">
          <div className="sk" style={{ width: 42, height: 42 }} />
          <div>
            <div className="sk" style={{ width: 120, height: 11, marginBottom: 7 }} />
            <div className="sk" style={{ width: 220, height: 8 }} />
          </div>
        </div>
      </div>
      <div style={{ padding: 24 }}>
        <div className="sk" style={{ height: 220, borderRadius: 'var(--radius-lg)' }} />
      </div>
    </div>
  )
}

function TabContent({ tab }: { tab: Tab }) {
  if (tab === 'Preview') {
    return <div className="preview">DEPLOYED APP PREVIEW</div>
  }
  if (tab === 'Readme') {
    return (
      <div className="doc">
        {README_LINES.map((w, i) => (
          <div
            key={i}
            className="ln"
            style={{
              height: i === 0 ? 10 : 7,
              width: `${w}%`,
              marginBottom: i === 0 ? 12 : 8,
              ...(i === 0 ? { background: 'rgba(20,30,45,.14)' } : null),
            }}
          />
        ))}
      </div>
    )
  }
  return <div className="prose">{APPROACH_TEXT}</div>
}

export function ReviewScreen() {
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('Preview')
  const [scores, setScores] = useState<Partial<Record<CritKey, number>>>({ CODE: 3.5, APPROACH: 2.8 })
  const [note, setNote] = useState('')
  const [decision, setDecision] = useState<Decision | null>(null)

  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 650)
    return () => window.clearTimeout(id)
  }, [])

  const scored = CRIT.filter((cr) => scores[cr.k] != null).map((cr) => ({
    label: cr.l,
    value: scores[cr.k] as number,
  }))
  const avg = scored.length ? scored.reduce((a, s) => a + s.value, 0) / scored.length : null

  if (loading) {
    return (
      <Stage>
        <Skeleton />
      </Stage>
    )
  }

  return (
    <Stage>
      <div className="shell">
        <div className="rv-hd">
          <div className="ident">
            <Avatar initials={CANDIDATE.initials} />
            <div style={{ minWidth: 0 }}>
              <div className="nm">{CANDIDATE.name}</div>
              <div className="rl">{CANDIDATE.role}</div>
            </div>
          </div>
          <div className="hactions">
            {decision ? (
              <Badge tone={DECMAP[decision].tone}>{DECMAP[decision].label}</Badge>
            ) : (
              <Badge tone="accent">Needs review</Badge>
            )}
            <Button variant="ghost" iconRight="↗">
              Repo
            </Button>
            <Button variant="primary">View demo</Button>
          </div>
        </div>

        <div className="rv-body">
          <div className="col">
            <div className="tabs" role="tablist" aria-label="Submission evidence">
              {TABS.map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  className={tab === t ? 'on' : ''}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div role="tabpanel" aria-label={tab}>
              <TabContent tab={tab} />
            </div>
          </div>

          <aside className="rail">
            <div>
              <div className="eb" style={{ marginBottom: 5 }}>
                Submitted
              </div>
              <div className="rv">{CANDIDATE.submitted}</div>
            </div>
            <div>
              <div className="eb" style={{ marginBottom: 5 }}>
                Deployed URL
              </div>
              <div className="rv" style={{ color: 'var(--accent)' }}>
                {CANDIDATE.url}
              </div>
            </div>
            <div>
              <div className="eb" style={{ marginBottom: 8 }}>
                Tech stack
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {STACK.map((s) => (
                  <Tag key={s}>{s}</Tag>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {decision ? (
          <div className="dock rise">
            <GlassPanel finish="light" style={{ padding: '20px 22px', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Badge tone={DECMAP[decision].tone}>{DECMAP[decision].label}</Badge>
                  <div>
                    <div style={{ font: '400 14px var(--font-sans)' }}>{DECMAP[decision].t}</div>
                    <div style={{ font: '400 11px var(--font-sans)', color: 'var(--muted)' }}>
                      by Alex Chen · Jul 10
                      {avg != null ? ` · avg ${avg.toFixed(1)} of 4` : ''}
                      {note.trim() ? ' · noted' : ''}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" onClick={() => setDecision(null)}>
                  Change decision
                </Button>
              </div>
              {scored.length ? (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-default)' }}>
                  <SpectrumScore
                    finish="light"
                    items={scored}
                    style={{
                      padding: 0,
                      border: 0,
                      boxShadow: 'none',
                      background: 'transparent',
                      borderRadius: 0,
                      overflow: 'visible',
                    }}
                  />
                </div>
              ) : null}
            </GlassPanel>
          </div>
        ) : (
          <div className="dock rise">
            <GlassPanel finish="light" style={{ padding: '20px 22px', borderRadius: 'var(--radius-xl)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  marginBottom: 18,
                }}
              >
                <span
                  style={{
                    font: '500 10px/1 var(--font-sans)',
                    letterSpacing: 'var(--tracking-label)',
                    textTransform: 'uppercase',
                    color: 'var(--accent)',
                  }}
                >
                  Scorecard
                </span>
                <span style={{ font: '400 11px var(--font-sans)', color: 'var(--slate)' }}>
                  tap to score · 1 = weak · 4 = excellent
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
                {CRIT.map((cr) => {
                  const cur = Math.round(scores[cr.k] ?? 0)
                  return (
                    <div key={cr.k} className="srow">
                      <span className="scl">{cr.l}</span>
                      <div className="scale" role="group" aria-label={cr.l}>
                        {[1, 2, 3, 4].map((v) => (
                          <button
                            key={v}
                            className={cur === v ? 'on' : ''}
                            aria-pressed={cur === v}
                            aria-label={`${cr.l}, score ${v} of 4`}
                            onClick={() => setScores((s) => ({ ...s, [cr.k]: v }))}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
              <textarea
                className="rv-ta"
                aria-label="Review note"
                placeholder="What stood out, and why"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="docfoot">
                <span className="reclab">Recommendation</span>
                <Button variant="ghost" onClick={() => setDecision('reject')}>
                  Reject
                </Button>
                <Button variant="soft" onClick={() => setDecision('maybe')}>
                  Maybe
                </Button>
                <Button variant="primary" onClick={() => setDecision('advance')}>
                  Advance
                </Button>
              </div>
            </GlassPanel>
          </div>
        )}
      </div>
    </Stage>
  )
}
