import { motion } from 'framer-motion'

const statusConfig = {
  waiting: { bg: 'var(--sev-pending-bg)', border: 'var(--sev-pending)', icon: null },
  running: { bg: 'var(--aura-accent)', border: 'var(--aura-accent)', icon: null },
  complete: { bg: 'var(--sev-low)', border: 'var(--sev-low)', icon: 'check' },
  blocked: { bg: 'var(--sev-critical)', border: 'var(--sev-critical)', icon: 'x' },
  review: { bg: 'var(--sev-medium)', border: 'var(--sev-medium)', icon: 'warning' },
}

export default function NodeStatusDot({ status = 'waiting', size = 8 }) {
  const config = statusConfig[status] || statusConfig.waiting

  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {status === 'running' && (
        <motion.span
          className="absolute rounded-full"
          style={{
            width: size * 1.8,
            height: size * 1.8,
            background: 'var(--aura-accent)',
            opacity: 0.3,
          }}
          animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <span
        className="rounded-full relative z-10 inline-flex items-center justify-center"
        style={{
          width: size,
          height: size,
          background: config.bg,
          border: `1px solid ${config.border}`,
        }}
      >
        {config.icon === 'check' && (
          <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 10 10" fill="none">
            <path d="M2 5L4.5 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {config.icon === 'x' && (
          <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 10 10" fill="none">
            <path d="M3 3L7 7M7 3L3 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </span>
    </span>
  )
}
