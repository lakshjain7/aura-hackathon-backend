import { motion } from 'framer-motion'

export default function ConnectorArrow({ fromStatus, blocked, review, compact, vertical }) {
  const isActive = fromStatus === 'complete' || fromStatus === 'blocked'
  const width = compact ? 16 : 32
  const height = compact ? 2 : vertical ? 24 : 2

  if (vertical) {
    return (
      <div className="flex justify-center py-1" style={{ width: '100%' }}>
        <svg width="2" height="24" viewBox="0 0 2 24">
          <motion.line
            x1="1" y1="0" x2="1" y2="24"
            stroke={blocked ? 'var(--sev-critical)' : isActive ? 'var(--aura-accent)' : 'var(--aura-border)'}
            strokeWidth="1.5"
            strokeDasharray={blocked || !isActive ? '3 3' : 'none'}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: isActive ? 1 : 0.5 }}
            transition={{ duration: 0.3 }}
          />
          {isActive && !blocked && (
            <motion.polygon
              points="1,24 -2,18 4,18"
              fill="var(--aura-accent)"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.2 }}
            />
          )}
        </svg>
      </div>
    )
  }

  return (
    <div className="flex items-center" style={{ width, flexShrink: 0 }}>
      <svg width={width} height="12" viewBox={`0 0 ${width} 12`}>
        <motion.line
          x1="0" y1="6" x2={width - 4} y2="6"
          stroke={blocked ? 'var(--sev-critical)' : review ? 'var(--sev-medium)' : isActive ? 'var(--aura-accent)' : 'var(--aura-border)'}
          strokeWidth="1.5"
          strokeDasharray={blocked || review || !isActive ? '3 3' : 'none'}
          initial={{ strokeDashoffset: width }}
          animate={{ strokeDashoffset: isActive ? 0 : width }}
          transition={{ duration: 0.3 }}
        />
        {isActive && !blocked && (
          <motion.polygon
            points={`${width},6 ${width - 5},3 ${width - 5},9`}
            fill={review ? 'var(--sev-medium)' : 'var(--aura-accent)'}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.2 }}
          />
        )}
      </svg>
    </div>
  )
}
