import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useState } from 'react'
import type { AnchorHTMLAttributes, ReactNode } from 'react'

/*
  A small router on the History API. No dependency. Real, shareable URLs, and it keeps the
  board's scroll position when the producer comes back from an event.
*/

export type Route = { name: 'board' } | { name: 'event'; id: string } | { name: 'notFound' }

export function parseRoute(pathname: string): Route {
  if (pathname === '/' || pathname === '') return { name: 'board' }
  const m = pathname.match(/^\/event\/([^/]+)\/?$/)
  if (m) return { name: 'event', id: decodeURIComponent(m[1]) }
  return { name: 'notFound' }
}

export const eventPath = (id: string): string => `/event/${encodeURIComponent(id)}`

interface RouterValue {
  route: Route
  navigate: (to: string, opts?: { replace?: boolean }) => void
}

const RouterContext = createContext<RouterValue | null>(null)
const scrollByPath = new Map<string, number>()

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => window.location.pathname)

  const navigate = useCallback((to: string, opts?: { replace?: boolean }) => {
    if (to === window.location.pathname) return
    scrollByPath.set(window.location.pathname, window.scrollY)
    if (opts?.replace) window.history.replaceState({}, '', to)
    else window.history.pushState({}, '', to)
    setPath(to)
  }, [])

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useLayoutEffect(() => {
    window.scrollTo(0, scrollByPath.get(path) ?? 0)
  }, [path])

  return <RouterContext.Provider value={{ route: parseRoute(path), navigate }}>{children}</RouterContext.Provider>
}

export function useRouter(): RouterValue {
  const ctx = useContext(RouterContext)
  if (!ctx) throw new Error('useRouter must be used within RouterProvider')
  return ctx
}

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string
  children: ReactNode
}

export function Link({ to, children, onClick, ...rest }: LinkProps) {
  const { navigate } = useRouter()
  return (
    <a
      href={to}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented) return
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
        e.preventDefault()
        navigate(to)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}
