import type { Blocker, BlockerKind } from '../../domain/types.ts'

/*
  Blockers, risks, and open questions. Age carries the weight, because a nine day old
  blocker owned by the client is a different animal from a two day old one owned by the
  team. Empty states are written as good news, one distinct sentence each.
*/

interface Group {
  kind: BlockerKind
  label: string
  empty: string | null // null means the group is hidden when empty
}

const GROUPS: Group[] = [
  { kind: 'blocker', label: 'Blockers', empty: 'No blockers. Work can move.' },
  { kind: 'risk', label: 'Risks', empty: null },
  { kind: 'question', label: 'Open questions', empty: 'No open questions right now.' },
]

function Item({ b }: { b: Blocker }) {
  return (
    <div className="concern">
      <div className={`concern-age ${b.ageDays >= 7 ? 'old' : ''}`}>
        {b.ageDays}
        <span>{b.ageDays === 1 ? 'day' : 'days'}</span>
      </div>
      <div>
        <div className="concern-title">{b.title}</div>
        <div className="concern-owner">Owned by {b.owner.toLowerCase()}</div>
      </div>
    </div>
  )
}

export function Concerns({ blockers }: { blockers: Blocker[] }) {
  const open = blockers.filter((b) => b.state === 'open')

  return (
    <section>
      <h2 className="sec-title">Blockers, risks, and open questions</h2>
      {open.length === 0 ? (
        <div className="empty">Nothing is blocking this project. No blockers, risks, or open questions to chase.</div>
      ) : (
        <div className="concern-groups">
          {GROUPS.map((g) => {
            const items = open.filter((b) => b.kind === g.kind).sort((a, b) => b.ageDays - a.ageDays)
            if (items.length === 0 && g.empty === null) return null
            return (
              <div key={g.kind}>
                <div className="group-label">{g.label}</div>
                {items.length ? (
                  items.map((b) => <Item key={b.id} b={b} />)
                ) : (
                  <div className="empty">{g.empty}</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
