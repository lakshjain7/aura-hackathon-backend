import { useState, useCallback, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const icons = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
}

const colors = {
  success: 'var(--sev-low)',
  warning: 'var(--sev-medium)',
  error: 'var(--sev-critical)',
  info: 'var(--aura-accent)',
}

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId
    setToasts(prev => {
      const next = [...prev, { id, message, type, duration }]
      return next.slice(-3)
    })
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] flex flex-col gap-2 max-sm:left-4 max-sm:right-4 max-sm:items-center">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const Icon = icons[toast.type]
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, x: 100, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative overflow-hidden rounded-lg px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-sm"
                style={{
                  background: 'var(--aura-bg-elevated)',
                  border: `1px solid ${colors[toast.type]}30`,
                }}
              >
                <Icon size={16} style={{ color: colors[toast.type], flexShrink: 0 }} />
                <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>
                  {toast.message}
                </span>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-0.5 cursor-pointer"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <X size={14} />
                </button>
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5"
                  style={{ background: colors[toast.type] }}
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: toast.duration / 1000, ease: 'linear' }}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
