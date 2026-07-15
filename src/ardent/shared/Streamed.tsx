import type { StreamState } from '../ai/useStream.ts'

/*
  A streamed written line with its skeleton, its failure, and its sources. The skeleton is
  shaped like the incoming sentences, the error says what happened and what to do, and the
  retry keeps the producer's place. Sources render as chips so every claim shows its number.
*/

export function Streamed({
  stream,
  lines = 2,
  className,
}: {
  stream: StreamState
  lines?: number
  className?: string
}) {
  if (stream.error) {
    return (
      <div className="stream-error" role="alert">
        The written read did not come back. Your data is untouched.
        <button onClick={stream.retry}>Try again</button>
      </div>
    )
  }

  if (!stream.text && stream.streaming) {
    const widths = ['92%', '74%', '58%']
    return (
      <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className="skeleton-line" style={{ width: widths[i % widths.length] }} />
        ))}
      </div>
    )
  }

  return (
    <>
      <p className={className} aria-live="polite">
        {stream.text}
        {stream.streaming && <span className="read-caret" aria-hidden="true" />}
      </p>
      {stream.done && stream.sources.length > 0 && (
        <div className="sources">
          from{' '}
          {stream.sources.map((s, i) => (
            <span key={s.label}>
              {i > 0 && ', '}
              {s.label} <b>{s.value}</b>
            </span>
          ))}
        </div>
      )}
    </>
  )
}
