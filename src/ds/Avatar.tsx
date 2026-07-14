import type { HTMLAttributes } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  initials: string
  size?: number
}

/**
 * Avatar, a rounded-square initials tile with a slate-blue glass gradient.
 * Square with generous radius, never a circle, to match the card language.
 */
export function Avatar({ initials, size = 42, style, ...rest }: Props) {
  return (
    <div
      {...rest}
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(150deg, #8ea1b4, var(--accent))',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-sans)',
        fontSize: Math.round(size * 0.33),
        fontWeight: 400,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.4)',
        ...style,
      }}
    >
      {initials}
    </div>
  )
}
