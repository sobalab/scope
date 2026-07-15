import type { BudgetScope as Budget } from '../../domain/types.ts'

export function BudgetScope({ budget }: { budget: Budget }) {
  const hoursPct = Math.round((budget.hoursUsed / budget.hoursBudget) * 100)
  const scope = budget.scopeDelivered
  const gap = hoursPct - scope
  const scopeLeft = 100 - scope
  const hoursLeft = Math.max(0, 100 - hoursPct)

  const note =
    gap > 8
      ? `Spending ${gap} points faster than it ships. ${scopeLeft}% of scope still to build on ${hoursLeft}% of the budget.`
      : gap < -8
        ? `Shipping ahead of spend, ${scope}% delivered on ${hoursPct}% of hours.`
        : `Hours and scope are in step, ${hoursPct}% used against ${scope}% delivered.`

  return (
    <div className="panel">
      <h2 className="panel-title">Budget against scope</h2>
      <div className="budget-row">
        <div className="budget-label">
          <span>Hours used</span>
          <b>{hoursPct}%</b>
        </div>
        <div className="budget-track">
          <div className="budget-fill" style={{ width: `${Math.min(100, hoursPct)}%`, background: gap > 8 ? 'var(--accent)' : 'var(--slate)' }} />
        </div>
      </div>
      <div className="budget-row">
        <div className="budget-label">
          <span>Scope delivered</span>
          <b>{scope}%</b>
        </div>
        <div className="budget-track">
          <div className="budget-fill" style={{ width: `${scope}%`, background: 'var(--ink)' }} />
        </div>
      </div>
      <p className="budget-note">{note}</p>
    </div>
  )
}
