import type { HTMLAttributes, ReactNode } from 'react'

interface Props extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
}

/**
 * Tag, a soft-cornered metadata chip (tech stack, filters). Quieter than Badge:
 * sans-serif, sentence case, hairline border on white.
 */
export function Tag({ children, style, ...rest }: Props) {
  return (
    <span
      {...rest}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        padding: '4px 9px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--surface)',
        border: '1px solid var(--border-default)',
        fontFamily: 'var(--font-sans)',
        fontSize: '11px',
        fontWeight: 400,
        lineHeight: 1.3,
        color: 'var(--muted)',
        ...style,
      }}
    >
      {children}
    </span>
  )
}
