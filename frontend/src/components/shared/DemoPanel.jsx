import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, X, ChevronUp } from 'lucide-react'

const scenarios = [
  { id: 'telugu', label: 'Telugu complaint', color: 'var(--aura-accent)' },
  { id: 'hindi', label: 'Hindi complaint', color: 'var(--aura-accent)' },
  { id: 'bengali', label: 'Bengali complaint', color: 'var(--aura-accent)' },
  { id: 'injection', label: 'Injection attack', color: 'var(--sev-critical)' },
  { id: 'cluster', label: 'Trigger cluster', color: 'var(--sev-medium)' },
  { id: 'resolution', label: 'Full resolution flow', color: 'var(--sev-low)' },
]

export default function DemoPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('demo') === 'true' || localStorage.getItem('aura_demo_mode') === 'true') {
      setVisible(true)
      localStorage.setItem('aura_demo_mode', 'true')
    }
    // Always show in development
    if (import.meta.env.DEV) setVisible(true)
  }, [])

  const triggerScenario = (scenarioId) => {
    window.dispatchEvent(new CustomEvent('aura_demo', { detail: { scenario: scenarioId } }))
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 right-4 z-[90]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="mb-2 rounded-xl p-3 w-56"
            style={{
              background: 'var(--aura-bg-elevated)',
              border: '1px solid var(--aura-border)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--text-accent)' }}>
                DEMO SCENARIOS
              </span>
              <button onClick={() => setIsOpen(false)} className="cursor-pointer" style={{ color: 'var(--text-tertiary)' }}>
                <X size={12} />
              </button>
            </div>
            <div className="space-y-1">
              {scenarios.map(s => (
                <button
                  key={s.id}
                  onClick={() => triggerScenario(s.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-medium cursor-pointer transition-all text-left"
                  style={{
                    background: 'var(--aura-bg-surface)',
                    border: '1px solid var(--aura-border)',
                    color: s.color,
                  }}
                >
                  <Play size={10} />
                  {s.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer"
        style={{
          background: 'var(--aura-bg-elevated)',
          border: '1px solid var(--aura-border)',
          color: 'var(--text-tertiary)',
        }}
        whileHover={{ borderColor: 'var(--aura-accent)', color: 'var(--text-accent)' }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="font-mono text-[10px] font-bold">DEMO</span>
        <ChevronUp size={10} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
      </motion.button>
    </div>
  )
}
