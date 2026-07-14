import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'

type Finish = 'light' | 'tint' | 'dark'

interface Props extends HTMLAttributes<HTMLDivElement> {
  finish?: Finish
  children: ReactNode
}

/**
 * GlassPanel, the frosted surface that defines the system. Three finishes:
 * `light` (white frost), `tint` (slate gradient glass), `dark` (the deep panel
 * behind the spectrum). Must sit over something with contrast for the blur to read.
 */
export function GlassPanel({ finish = 'light', children, style, ...rest }: Props) {
  const finishes: Record<Finish, CSSProperties> = {
    light: {
      background: 'var(--glass-light-bg)',
      border: '1px solid var(--glass-light-border)',
      backdropFilter: 'var(--blur)',
      WebkitBackdropFilter: 'var(--blur)',
      boxShadow: 'var(--shadow-glass)',
    },
    tint: {
      background: 'var(--glass-tint-bg)',
      border: '1px solid var(--glass-tint-border)',
      backdropFilter: 'var(--blur-soft)',
      WebkitBackdropFilter: 'var(--blur-soft)',
      boxShadow: '0 16px 34px -20px rgba(20,30,45,.6), inset 0 1px 0 rgba(255,255,255,.4)',
      color: '#fff',
    },
    dark: {
      background: 'var(--glass-dark-bg)',
      border: '1px solid rgba(255,255,255,.10)',
      boxShadow: 'var(--shadow-dark)',
      color: '#fff',
    },
  }
  return (
    <div
      {...rest}
      style={{
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-6)',
        ...finishes[finish],
        ...style,
      }}
    >
      {children}
    </div>
  )
}
