import type { ActivityEvent } from '../../domain/types.ts'

const dayLabel = (daysAgo: number): string =>
  daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`

export function Activity({ activity }: { activity: ActivityEvent[] }) {
  const recent = [...activity].filter((e) => e.daysAgo <= 14).sort((a, b) => a.daysAgo - b.daysAgo)

  if (recent.length === 0) {
    const last = activity.length ? Math.min(...activity.map((e) => e.daysAgo)) : null
    return (
      <section>
        <h2 className="sec-title">Recent activity</h2>
        <div className="empty">
          No one has logged activity here in two weeks.
          {last != null ? ` The last update was ${last} days ago.` : ''}
        </div>
      </section>
    )
  }

  const byDay = new Map<number, ActivityEvent[]>()
  for (const e of recent) {
    const list = byDay.get(e.daysAgo)
    if (list) list.push(e)
    else byDay.set(e.daysAgo, [e])
  }
  const days = [...byDay.keys()].sort((a, b) => a - b)

  return (
    <section>
      <div className="sec-title">Recent activity</div>
      {days.map((d) => (
        <div key={d} className="act-day">
          <div className="act-daylabel">{dayLabel(d)}</div>
          {byDay.get(d)!.map((e) => (
            <div key={e.id} className="act-line">
              <span>{e.text}</span>
              <span className="act-who">by {e.who}</span>
            </div>
          ))}
        </div>
      ))}
    </section>
  )
}
