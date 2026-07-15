import { useState } from 'react'

export function Actions({ snoozed }: { snoozed: boolean }) {
  const [isSnoozed, setSnoozed] = useState(snoozed)

  return (
    <div className="panel">
      <h2 className="panel-title">Actions</h2>
      <div className="actions-list">
        <button className="action-btn primary">
          Chase the client
          <span className="action-hint">email</span>
        </button>
        {isSnoozed ? (
          <button className="action-btn" onClick={() => setSnoozed(false)}>
            Snoozed until tomorrow morning
            <span className="action-hint">bring back</span>
          </button>
        ) : (
          <button className="action-btn" onClick={() => setSnoozed(true)}>
            Snooze until tomorrow
            <span className="action-hint">handled</span>
          </button>
        )}
        <button className="action-btn">
          Open in the client's tools
          <span className="action-hint">repo, deploy</span>
        </button>
      </div>
    </div>
  )
}
