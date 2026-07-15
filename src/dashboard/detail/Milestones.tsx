import type { Milestone, MilestoneState } from '../../domain/types.ts'
import { dayPhrase } from '../../lib/format.ts'

const STATE_LABEL: Record<MilestoneState, string> = {
  delivered: 'Delivered',
  current: 'In progress',
  slipped: 'Slipped',
  upcoming: 'Upcoming',
}

export function Milestones({ milestones }: { milestones: Milestone[] }) {
  const ordered = [...milestones].sort((a, b) => a.dueInDays - b.dueInDays)

  return (
    <section>
      <h2 className="sec-title">Milestones</h2>
      <div className="ms">
        {ordered.map((m) => (
          <div key={m.id} className="ms-item">
            <div className="ms-spine" />
            <div className={`ms-node ${m.state}`} />
            <div>
              <div className="ms-title">{m.title}</div>
              <div className="ms-meta">
                {STATE_LABEL[m.state]}, {dayPhrase(m.dueInDays)}
              </div>
              {m.state === 'slipped' && m.slippedFrom != null && (
                <div className="ms-meta ms-slip">
                  First promised {dayPhrase(m.slippedFrom)}
                  {m.slipCount ? `, slipped ${m.slipCount} times` : ''}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
