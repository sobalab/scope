import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useState } from 'react'
import type { AnchorHTMLAttributes, ReactNode } from 'react'

/*
  A small router on the History API. No dependency. It gives real, shareable URLs, and
  it preserves the overview's scroll position when you come back from a project, so you
  never lose your place in a triage list.
*/

export type Route = { name: 'overview' } | { name: 'project'; id: string } | { name: 'notFound' }

export function parseRoute(pathname: string): Route {
  if (pathname === '/' || pathname === '') return { name: 'overview' }
  const m = pathname.match(/^\/project\/([^/]+)\/?$/)
  if (m) return { name: 'project', id: decodeURIComponent(m[1]) }
  return { name: 'notFound' }
}

interface RouterValue {
  path: string
  route: Route
  navigate: (to: string, opts?: { replace?: boolean }) => void
}

const RouterContext = createContext<RouterValue | null>(null)

// Remembers where each path was scrolled, so returning restores it.
const scrollByPath = new Map<string, number>()

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => window.location.pathname)

  const navigate = useCallback(
    (to: string, opts?: { replace?: boolean }) => {
      if (to === window.location.pathname) return
      scrollByPath.set(window.location.pathname, window.scrollY)
      if (opts?.replace) window.history.replaceState({}, '', to)
      else window.history.pushState({}, '', to)
      setPath(to)
    },
    [],
  )

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Restore the scroll saved for this path, or start at the top for a fresh page.
  useLayoutEffect(() => {
    window.scrollTo(0, scrollByPath.get(path) ?? 0)
  }, [path])

  return (
    <RouterContext.Provider value={{ path, route: parseRoute(path), navigate }}>
      {children}
    </RouterContext.Provider>
  )
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

/** An anchor that navigates in app but still behaves like a link (cmd-click, middle-click). */
export function Link({ to, children, onClick, ...rest }: LinkProps) {
  const { navigate } = useRouter()
  return (
    <a
      href={to}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented) return
        // let the browser handle new-tab and modified clicks
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

export const projectPath = (id: string): string => `/project/${encodeURIComponent(id)}`
