import { motion, AnimatePresence } from 'framer-motion'
import SeverityBadge from '../shared/SeverityBadge'
import { BHASHINI_LANGUAGES } from '../../utils/constants'

const MOCK_FEED = [
  { id: 'GR-2026-0861', severity: 'critical', category: 'Sanitation', language: 'hi', location: 'Ward 14, Madhapur', timeAgo: '2s ago' },
  { id: 'GR-2026-0860', severity: 'high', category: 'Water Supply', language: 'te', location: 'Ward 12, Gachibowli', timeAgo: '15s ago' },
  { id: 'GR-2026-0859', severity: 'medium', category: 'Road', language: 'en', location: 'Ward 8, Kondapur', timeAgo: '34s ago' },
  { id: 'GR-2026-0858', severity: 'high', category: 'Drainage', language: 'bn', location: 'Ward 14, Madhapur', timeAgo: '1m ago' },
  { id: 'GR-2026-0857', severity: 'critical', category: 'Sanitation', language: 'ta', location: 'Ward 14, Madhapur', timeAgo: '2m ago' },
  { id: 'GR-2026-0856', severity: 'low', category: 'Parks', language: 'en', location: 'Ward 6, Jubilee Hills', timeAgo: '3m ago' },
  { id: 'GR-2026-0855', severity: 'medium', category: 'Electricity', language: 'hi', location: 'Ward 10, Raidurg', timeAgo: '4m ago' },
  { id: 'GR-2026-0854', severity: 'high', category: 'Water Supply', language: 'kn', location: 'Ward 9, HITEC City', timeAgo: '5m ago' },
  { id: 'GR-2026-0853', severity: 'medium', category: 'Sanitation', language: 'mr', location: 'Ward 11, Miyapur', timeAgo: '7m ago' },
  { id: 'GR-2026-0852', severity: 'low', category: 'Road', language: 'en', location: 'Ward 5, Banjara Hills', timeAgo: '9m ago' },
  { id: 'GR-2026-0851', severity: 'critical', category: 'Drainage', language: 'te', location: 'Ward 14, Madhapur', timeAgo: '11m ago' },
  { id: 'GR-2026-0850', severity: 'medium', category: 'Electricity', language: 'gu', location: 'Ward 7, Kukatpally', timeAgo: '14m ago' },
]

export default function LiveFeed({ events = MOCK_FEED, maxItems = 12 }) {
  const items = events.slice(0, maxItems)

  return (
    <div className="space-y-1">
      <AnimatePresence mode="popLayout">
        {items.map((item, i) => {
          const langObj = BHASHINI_LANGUAGES.find(l => l.code === item.language)
          const opacity = 1 - (i / maxItems) * 0.6

          return (
            <motion.div
              key={item.id}
              layout
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{
                background: 'var(--aura-bg-surface)',
                border: '1px solid var(--aura-border)',
                opacity,
              }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="font-mono text-[10px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                {item.id}
              </span>
              <SeverityBadge severity={item.severity} size="sm" />
              <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                {item.category}
              </span>
              {langObj && langObj.code !== 'en' && (
                <span
                  className="text-[10px] px-1 py-0.5 rounded flex-shrink-0"
                  style={{
                    background: 'var(--aura-accent-subtle)',
                    color: 'var(--text-accent)',
                    direction: langObj.rtl ? 'rtl' : 'ltr',
                  }}
                >
                  {langObj.nativeName}
                </span>
              )}
              <span className="text-[10px] truncate flex-1" style={{ color: 'var(--text-tertiary)' }}>
                {item.location}
              </span>
              <span className="font-mono text-[9px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                {item.timeAgo}
              </span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
