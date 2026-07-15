import { useCallback, useEffect, useState } from 'react'
import type { Source, Written } from './compose.ts'

/*
  A mock stream. It composes the written text from the signals, then reveals it word by
  word on a realistic delay, exposing skeleton, streaming, done, and error states with a
  retry that keeps the producer's place. This is the no-key path; a live model would swap
  in behind the same interface. prefers-reduced-motion shows the finished text at once.
*/

// Arms the next stream to fail once, so the failed-response state is reachable in the app.
let failNext = false
export const armFailure = (): void => {
  failNext = true
}

const reducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export interface StreamState {
  text: string
  sources: Source[]
  streaming: boolean
  done: boolean
  error: boolean
  retry: () => void
}

export function useStream(produce: () => Written, deps: readonly unknown[]): StreamState {
  const [text, setText] = useState('')
  const [sources, setSources] = useState<Source[]>([])
  const [streaming, setStreaming] = useState(true)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    let timer = 0
    setText('')
    setSources([])
    setError(false)
    setDone(false)
    setStreaming(true)

    let full: Written
    try {
      full = produce()
    } catch {
      setStreaming(false)
      setError(true)
      return
    }

    const willFail = failNext
    if (willFail) failNext = false

    if (reducedMotion() && !willFail) {
      setText(full.text)
      setSources(full.sources)
      setStreaming(false)
      setDone(true)
      return
    }

    const words = full.text.split(' ')
    const failAt = Math.max(2, Math.floor(words.length * 0.4))
    let i = 0

    const tick = () => {
      if (cancelled) return
      if (willFail && i >= failAt) {
        setStreaming(false)
        setError(true)
        return
      }
      i += 1
      setText(words.slice(0, i).join(' '))
      if (i < words.length) {
        timer = window.setTimeout(tick, 26)
      } else {
        setStreaming(false)
        setDone(true)
        setSources(full.sources)
      }
    }
    timer = window.setTimeout(tick, 360)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, ...deps])

  const retry = useCallback(() => setAttempt((a) => a + 1), [])
  return { text, sources, streaming, done, error, retry }
}
