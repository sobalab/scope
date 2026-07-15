import { useSyncExternalStore } from 'react'

/*
  A tiny shared store for the two bits of cross-page state: which events the producer has
  set aside (handled, stop nagging until tomorrow), and the current toast. Module level so
  the board and the detail page stay in step without a provider.
*/

interface ToastState {
  text: string
  undo?: () => void
}

interface ArdentState {
  setAside: ReadonlySet<string>
  toast: ToastState | null
}

let state: ArdentState = { setAside: new Set(), toast: null }
const listeners = new Set<() => void>()
let toastTimer = 0

const emit = () => listeners.forEach((l) => l())

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export const useArdentStore = (): ArdentState => useSyncExternalStore(subscribe, () => state)

export function showToast(text: string, undo?: () => void): void {
  window.clearTimeout(toastTimer)
  state = { ...state, toast: { text, undo } }
  emit()
  toastTimer = window.setTimeout(() => {
    state = { ...state, toast: null }
    emit()
  }, 6000)
}

export function dismissToast(): void {
  window.clearTimeout(toastTimer)
  state = { ...state, toast: null }
  emit()
}

export function toggleSetAside(id: string, name: string): void {
  const next = new Set(state.setAside)
  if (next.has(id)) {
    next.delete(id)
    state = { ...state, setAside: next }
    emit()
    showToast(`${name} is back on the board.`)
  } else {
    next.add(id)
    state = { ...state, setAside: next }
    emit()
    showToast(`${name} set aside. It comes back tomorrow morning.`, () => {
      const undone = new Set(state.setAside)
      undone.delete(id)
      state = { ...state, setAside: undone }
      emit()
      dismissToast()
    })
  }
}
