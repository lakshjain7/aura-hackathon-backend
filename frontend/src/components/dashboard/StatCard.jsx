import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import LoadingSkeleton from '../shared/LoadingSkeleton'

export default function StatCard({ value, label, accent = false, trend, loading = false, pulseDot = false, suffix = '' }) {
  const numRef = useRef(null)

  useEffect(() => {
    if (loading || !numRef.current) return
    const num = parseFloat(value)
    if (isNaN(num)) {
      numRef.current.textContent = value
      return
    }
    gsap.fromTo(numRef.current,
      { textContent: 0 },
      {
        textContent: num,
        duration: 1.5,
        ease: 'power2.out',
        snap: { textContent: num % 1 === 0 ? 1 : 0.1 },
        onUpdate() {
          const v = parseFloat(numRef.current.textContent)
          numRef.current.textContent = num % 1 === 0 ? Math.round(v) : v.toFixed(1)
        },
      }
    )
  }, [value, loading])

  if (loading) return <LoadingSkeleton variant="stat" />

  return (
    <motion.div
      className="rounded-xl p-5 relative overflow-hidden"
      style={{
        background: 'var(--aura-bg-surface)',
        border: '1px solid var(--aura-border)',
        borderTop: `3px solid ${accent ? 'var(--aura-accent)' : 'var(--aura-border)'}`,
      }}
      whileHover={{ y: -2, borderColor: 'var(--aura-border-hover)' }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              ref={numRef}
              className="font-mono text-3xl font-bold"
              style={{ color: accent ? 'var(--aura-accent-light)' : 'var(--text-primary)' }}
            >
              {value}
            </span>
            {suffix && (
              <span className="font-mono text-lg" style={{ color: 'var(--text-tertiary)' }}>{suffix}</span>
            )}
            {pulseDot && (
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: 'var(--sev-critical)', animation: 'blink 1s infinite' }}
              />
            )}
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        </div>
        {trend && (
          <span
            className="text-xs font-mono px-1.5 py-0.5 rounded"
            style={{
              background: trend.startsWith('+') ? 'var(--sev-low-bg)' : 'var(--sev-critical-bg)',
              color: trend.startsWith('+') ? 'var(--sev-low)' : 'var(--sev-critical)',
            }}
          >
            {trend}
          </span>
        )}
      </div>
    </motion.div>
  )
}
