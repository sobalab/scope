import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'

export type BadgeTone = 'accent' | 'neutral' | 'ink'

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  children: ReactNode
}

/**
 * Status pill, an uppercase state label (NEEDS REVIEW, ADVANCED).
 * Near-monochrome by default; `tone` shifts the accent, never loud.
 */
export function Badge({ tone = 'accent', children, style, ...rest }: Props) {
  const tones: Record<BadgeTone, CSSProperties> = {
    accent: { background: 'var(--accent-soft)', color: 'var(--accent)' },
    neutral: { background: 'var(--ground-2)', color: 'var(--muted)' },
    ink: { background: 'var(--ink)', color: '#fff' },
  }
  return (
    <span
      {...rest}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        whiteSpace: 'nowrap',
        padding: '5px 11px',
        borderRadius: 'var(--radius-pill)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-label)',
        fontWeight: 400,
        letterSpacing: '.04em',
        textTransform: 'uppercase',
        lineHeight: 1,
        ...tones[tone],
        ...style,
      }}
    >
      {children}
    </span>
  )
}
