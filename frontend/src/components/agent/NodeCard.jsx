import { motion } from 'framer-motion'
import NodeStatusDot from '../shared/NodeStatusDot'

const stateStyles = {
  waiting: {
    background: 'var(--node-waiting-bg)',
    border: '0.5px solid var(--node-waiting-border)',
    nameColor: 'var(--text-secondary)',
    boxShadow: 'none',
  },
  running: {
    background: 'var(--node-running-bg)',
    border: '1px solid var(--node-running-border)',
    nameColor: 'var(--text-primary)',
    boxShadow: '0 0 12px var(--aura-accent-glow)',
  },
  complete: {
    background: 'var(--node-complete-bg)',
    border: '1px solid var(--node-complete-border)',
    nameColor: 'var(--text-primary)',
    boxShadow: 'none',
  },
  blocked: {
    background: 'var(--node-blocked-bg)',
    border: '1px solid var(--node-blocked-border)',
    nameColor: 'var(--text-critical)',
    boxShadow: '0 0 12px rgba(239,68,68,0.15)',
  },
  review: {
    background: 'var(--node-review-bg)',
    border: '1px solid var(--node-review-border)',
    nameColor: 'var(--sev-medium)',
    boxShadow: '0 0 12px rgba(234,179,8,0.1)',
  },
}

export default function NodeCard({ agent, state, compact, dimmed, isReview, pendingReview, translationInfo }) {
  const { status } = state
  const styles = stateStyles[status] || stateStyles.waiting

  if (compact) {
    return (
      <motion.div
        className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-md min-w-[56px]"
        style={{
          background: styles.background,
          border: styles.border,
          opacity: dimmed ? 0.25 : 1,
          filter: dimmed ? 'grayscale(60%)' : 'none',
        }}
        layout
      >
        <NodeStatusDot status={status} size={8} />
        <span className="text-[10px] font-medium text-center leading-tight" style={{ color: styles.nameColor }}>
          {agent.shortName}
        </span>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="relative flex flex-col p-3 rounded-lg min-w-[140px] max-w-[180px] md:min-h-[100px]"
      style={{
        background: styles.background,
        border: styles.border,
        boxShadow: styles.boxShadow,
        opacity: dimmed ? 0.25 : 1,
        filter: dimmed ? 'grayscale(60%)' : 'none',
      }}
      layout
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Node number */}
      <span className="font-mono text-[10px] mb-1" style={{ color: 'var(--text-tertiary)' }}>
        {String(agent.id).padStart(2, '0')}
      </span>

      {/* Status + Name row */}
      <div className="flex items-center gap-1.5 mb-1">
        <NodeStatusDot status={status} size={8} />
        <span className="text-[13px] font-medium leading-tight" style={{ color: styles.nameColor }}>
          {agent.shortName}
        </span>
      </div>

      {/* Duration (complete state) */}
      {status === 'complete' && state.duration && (
        <span className="font-mono text-[11px] mb-0.5" style={{ color: 'var(--text-tertiary)' }}>
          {state.duration}
        </span>
      )}

      {/* Summary (complete state) */}
      {status === 'complete' && state.summary && (
        <span className="text-[11px] italic leading-snug line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
          {state.summary}
        </span>
      )}

      {/* Blocked tooltip */}
      {status === 'blocked' && (
        <motion.div
          className="mt-1.5 px-2 py-1 rounded-md text-[10px] font-medium"
          style={{
            background: 'var(--sev-critical-bg)',
            border: '1px solid var(--sev-critical-border)',
            color: 'var(--text-critical)',
          }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          Blocked: Prompt injection detected
        </motion.div>
      )}

      {/* Review state */}
      {isReview && (
        <span className="text-[10px] mt-1" style={{ color: 'var(--sev-medium)' }}>
          Low confidence: {state.data?.confidence || '71'}%
        </span>
      )}

      {/* Pending review badge */}
      {pendingReview && (
        <span className="text-[9px] mt-1 px-1.5 py-0.5 rounded-full" style={{ background: 'var(--sev-medium-bg)', color: 'var(--sev-medium)' }}>
          pending review
        </span>
      )}

      {/* Translation info */}
      {translationInfo && status === 'complete' && (
        <div className="mt-1.5 text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
          <div className="font-medium" style={{ color: 'var(--text-accent)' }}>
            {translationInfo.fromScript} → English
          </div>
          <div className="line-clamp-1 mt-0.5 opacity-70">{translationInfo.fromText?.slice(0, 40)}</div>
          <div className="line-clamp-1 opacity-50">{translationInfo.toText?.slice(0, 40)}</div>
        </div>
      )}
    </motion.div>
  )
}
