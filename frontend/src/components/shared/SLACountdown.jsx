import { useSLATimer } from '../../hooks/useSLATimer'
import { motion } from 'framer-motion'

export default function SLACountdown({ deadlineTimestamp }) {
  const { text, severity } = useSLATimer(deadlineTimestamp)

  const colorMap = {
    normal: 'var(--text-secondary)',
    warning: 'var(--sev-medium)',
    critical: 'var(--sev-critical)',
    breached: 'var(--sev-critical)',
  }

  return (
    <motion.span
      className="font-mono text-xs inline-flex items-center gap-1.5"
      style={{ color: colorMap[severity] }}
      animate={severity === 'critical' ? { x: [-2, 2, -2, 2, 0] } : {}}
      transition={{ duration: 0.4 }}
    >
      {severity === 'breached' && (
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{
            background: 'var(--sev-critical)',
            animation: 'blink 1s infinite',
          }}
        />
      )}
      {severity === 'critical' && (
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{
            background: 'var(--sev-critical)',
            animation: 'pulse-ring 1.4s infinite',
          }}
        />
      )}
      {text}
    </motion.span>
  )
}
