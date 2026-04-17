import { motion, AnimatePresence } from 'framer-motion'
import { formatTimestamp } from '../../utils/formatters'
import NodeStatusDot from '../shared/NodeStatusDot'

const typeColors = {
  node_transition: 'var(--aura-accent)',
  security_block: 'var(--sev-critical)',
  cluster_detected: 'var(--sev-medium)',
  escalation_triggered: 'var(--sev-high)',
  resolution_confirmed: 'var(--sev-low)',
  error: 'var(--sev-critical)',
}

export default function EventTimeline({ events = [] }) {
  return (
    <div className="rounded-lg p-3 space-y-1 max-h-48 overflow-y-auto" style={{ background: 'var(--aura-bg-base)' }}>
      <AnimatePresence mode="popLayout">
        {events.map((event, i) => (
          <motion.div
            key={`${event.node}-${event.status}-${i}`}
            className="flex items-center gap-3 py-1.5 px-2 rounded"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            style={{
              background: event.type === 'security_block' ? 'var(--sev-critical-bg)' :
                event.type === 'cluster_detected' ? 'var(--sev-medium-bg)' : 'transparent',
            }}
          >
            <NodeStatusDot status={event.status} size={6} />
            <span className="font-mono text-[11px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
              {formatTimestamp(event.receivedAt)}
            </span>
            <span className="text-xs font-medium flex-shrink-0" style={{ color: typeColors[event.type] || 'var(--text-secondary)' }}>
              {event.name || event.node}
            </span>
            <span className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
              {event.summary || `Status: ${event.status}`}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
