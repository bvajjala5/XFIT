import { createContext, useCallback, useContext, useState } from 'react'
import { X } from 'lucide-react'
import { initials } from '../lib/format.js'

/* ── Toasts ─────────────────────────────────────────────────────────────── */

const ToastContext = createContext(() => {})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setToasts((prev) => [...prev, { id, tone: 'info', ...toast }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id))
    }, 4600)
  }, [])

  const dismiss = (id) => setToasts((prev) => prev.filter((item) => item.id !== id))

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.tone}`}>
            <div className="toast-body">
              <p className="toast-title">{toast.title}</p>
              {toast.message ? <p className="toast-message">{toast.message}</p> : null}
            </div>
            <button type="button" className="toast-close" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/* ── Primitives ─────────────────────────────────────────────────────────── */

export function Avatar({ name, email, src, size = 36 }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) }
  if (src) return <img className="avatar" style={style} src={src} alt="" />
  return (
    <span className="avatar avatar-fallback" style={style} aria-hidden="true">
      {initials(name, email)}
    </span>
  )
}

export function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function Spinner({ label = 'Loading' }) {
  return (
    <span className="spinner" role="status" aria-label={label}>
      <span className="spinner-dot" />
    </span>
  )
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'accent' }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon stat-icon-${tone}`}>{Icon ? <Icon size={18} /> : null}</div>
      <div className="stat-text">
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
        {hint ? <p className="stat-hint">{hint}</p> : null}
      </div>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, message }) {
  return (
    <div className="empty-state">
      {Icon ? <Icon size={26} /> : null}
      <p className="empty-title">{title}</p>
      {message ? <p className="empty-message">{message}</p> : null}
    </div>
  )
}

export function ConfirmDialog({ open, title, message, confirmLabel, tone = 'danger', busy, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onCancel} role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={`btn btn-${tone}`} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
