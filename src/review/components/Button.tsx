import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'soft'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  iconRight?: ReactNode
}

/**
 * Pill button, the system's primary action affordance.
 * Three weights: solid ink `primary`, hairline `ghost`, tinted `soft`.
 */
export function Button({ variant = 'primary', size = 'md', iconRight, children, style, ...rest }: Props) {
  const pad = size === 'sm' ? '7px 14px' : size === 'lg' ? '11px 22px' : '9px 18px'
  const fs = size === 'sm' ? '12.5px' : size === 'lg' ? '15px' : '13px'
  const variants: Record<Variant, CSSProperties> = {
    primary: { background: 'var(--ink)', color: '#fff', border: '1px solid var(--ink)' },
    ghost: { background: 'var(--surface)', color: 'var(--dark-glass)', border: '1px solid var(--border-strong)' },
    soft: { background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid transparent' },
  }
  return (
    <button
      {...rest}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        whiteSpace: 'nowrap',
        padding: pad,
        borderRadius: 'var(--radius-pill)',
        fontFamily: 'var(--font-sans)',
        fontSize: fs,
        fontWeight: 400,
        lineHeight: 1,
        cursor: 'pointer',
        transition: 'all var(--dur) var(--ease)',
        ...variants[variant],
        ...style,
      }}
    >
      {children}
      {iconRight ? <span aria-hidden="true">{iconRight}</span> : null}
    </button>
  )
}
