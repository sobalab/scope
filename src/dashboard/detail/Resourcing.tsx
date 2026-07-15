import type { Allocation } from '../../domain/types.ts'

export function Resourcing({ resourcing }: { resourcing: Allocation[] }) {
  return (
    <div className="panel">
      <h2 className="panel-title">Resourcing</h2>
      {resourcing.map((r) => (
        <div key={r.name} className="resource">
          <div>
            <div className="resource-name">{r.name}</div>
            <div className="resource-role">{r.role}</div>
          </div>
          <div className="resource-alloc">{r.allocation}%</div>
        </div>
      ))}
    </div>
  )
}
