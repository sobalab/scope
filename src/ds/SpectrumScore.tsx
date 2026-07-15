import type { CSSProperties, HTMLAttributes } from 'react'

export interface SpectrumItem {
  label: string
  value: number
  /** Optional faint cohort tick, the average across other reviewers. */
  avg?: number
}

interface Props extends HTMLAttributes<HTMLDivElement> {
  items?: SpectrumItem[]
  axisLeft?: string
  axisRight?: string
  max?: number
  finish?: 'dark' | 'light'
  title?: string
}

/**
 * SpectrumScore, the system's signature data component. Each criterion is a
 * horizontal spectrum from `axisLeft` to `axisRight`; a mono-labelled marker sits
 * at the score, with a dashed remainder and an optional faint cohort tick.
 */
export function SpectrumScore({
  items = [],
  axisLeft = 'NEEDS WORK',
  axisRight = 'EXCEPTIONAL',
  max = 4,
  finish = 'dark',
  title,
  style,
  ...rest
}: Props) {
  const dark = finish === 'dark'
  const c = {
    fill: dark ? 'rgba(255,255,255,.75)' : 'var(--accent)',
    baseline: dark ? 'rgba(255,255,255,.2)' : 'rgba(20,30,45,.16)',
    tick: dark ? 'rgba(255,255,255,.35)' : 'rgba(20,30,45,.2)',
    chipBg: dark ? 'rgba(255,255,255,.94)' : 'var(--surface)',
    chipBorder: dark ? 'transparent' : 'var(--border-strong)',
    chipText: dark ? 'var(--dark-glass-2)' : 'var(--dark-glass)',
    axis: dark ? 'rgba(255,255,255,.45)' : 'var(--slate)',
    eyebrow: dark ? 'rgba(255,255,255,.5)' : 'var(--slate)',
    dots: dark ? 'rgba(255,255,255,.16)' : 'rgba(20,30,45,.08)',
  }
  const container: CSSProperties = dark
    ? { background: 'var(--glass-dark-bg)', boxShadow: 'var(--shadow-dark)' }
    : { background: 'var(--surface)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-card)' }

  return (
    <div
      {...rest}
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        padding: '28px 32px 24px',
        ...container,
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(${c.dots} 1px, transparent 1.4px)`,
          backgroundSize: '34px 34px',
          opacity: dark ? 0.5 : 0.6,
        }}
      />
      <div style={{ position: 'relative' }}>
        {title ? (
          <div
            style={{
              font: '500 10px/1 var(--font-sans)',
              letterSpacing: 'var(--tracking-label)',
              textTransform: 'uppercase',
              color: c.eyebrow,
              marginBottom: 24,
            }}
          >
            {title}
          </div>
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          {items.map((it) => {
            const pct = Math.max(6, Math.min(100, (it.value / max) * 100))
            const avgPct = it.avg != null ? Math.max(0, Math.min(100, (it.avg / max) * 100)) : null
            return (
              <div key={it.label} style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute', left: 0, right: 0, height: 2, borderTop: `2px dashed ${c.baseline}` }} />
                <div style={{ position: 'absolute', left: 0, width: `${pct}%`, height: 2, background: c.fill }} />
                {avgPct != null ? (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${avgPct}%`,
                      top: '50%',
                      transform: 'translate(-50%,-50%)',
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: c.tick,
                    }}
                  />
                ) : null}
                <div
                  style={{
                    position: 'absolute',
                    left: `${pct}%`,
                    top: '50%',
                    transform: 'translate(-50%,-50%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 9px',
                    borderRadius: 'var(--radius-sm)',
                    background: c.chipBg,
                    border: `1px solid ${c.chipBorder}`,
                    boxShadow: dark ? '0 4px 10px -4px rgba(0,0,0,.5)' : '0 4px 10px -6px rgba(20,30,45,.35)',
                    font: '400 10.5px var(--font-sans)',
                    color: c.chipText,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ width: 7, height: 7, background: 'var(--accent)', borderRadius: 1.5 }} />
                  {it.label}
                  <span style={{ marginLeft: 6, opacity: 0.6 }}>{it.value.toFixed(1)}</span>
                </div>
              </div>
            )
          })}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 24,
            font: '400 9.5px var(--font-sans)',
            letterSpacing: '.14em',
            color: c.axis,
          }}
        >
          <span>{axisLeft}</span>
          <span>{axisRight}</span>
        </div>
      </div>
    </div>
  )
}
