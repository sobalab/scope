import { dismissToast } from '../store.ts'

interface ToastData {
  text: string
  undo?: () => void
}

export function Toast({ toast }: { toast: ToastData }) {
  return (
    <div className="toast" role="status">
      <span>{toast.text}</span>
      {toast.undo && <button onClick={toast.undo}>Undo</button>}
      <button onClick={dismissToast} aria-label="Dismiss">
        Ok
      </button>
    </div>
  )
}
