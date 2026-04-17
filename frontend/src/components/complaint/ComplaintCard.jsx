import { motion } from 'framer-motion'
import { Check, ArrowRight, Edit3, MapPin, Smartphone } from 'lucide-react'
import SeverityBadge from '../shared/SeverityBadge'
import SLACountdown from '../shared/SLACountdown'
import { LanguageChipCompact } from '../language/LanguagePicker'

const SEV_COLOR = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#D97706',
  low: '#16A34A',
}

const SEV_BG = {
  critical: 'rgba(220,38,38,0.07)',
  high: 'rgba(234,88,12,0.07)',
  medium: 'rgba(217,119,6,0.07)',
  low: 'rgba(22,163,74,0.07)',
}

export default function ComplaintCard({ complaint, onResolve, onReassign, onOverride, index = 0 }) {
  const {
    id, severity, category, summary, location,
    language, slaDeadline, source, historicalContext,
  } = complaint

  const barColor = SEV_COLOR[severity] || '#6B7280'

  return (
    <motion.div
      className="relative rounded-xl overflow-hidden cursor-pointer"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{
        y: -2,
        boxShadow: `0 8px 24px rgba(0,0,0,0.10), 0 0 0 1px ${barColor}30`,
      }}
    >
      {/* Left severity bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: barColor,
          borderRadius: '12px 0 0 12px',
        }}
      />

      <div style={{ padding: '14px 16px 12px 20px' }}>
        {/* Row 1: ID + badges + SLA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#9CA3AF', letterSpacing: '0.05em' }}>{id}</span>
          <SeverityBadge severity={severity} size="sm" />
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 20,
            background: SEV_BG[severity] || '#F3F4F6',
            color: barColor,
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}>
            {category?.toUpperCase()}
          </span>
          <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <SLACountdown deadlineTimestamp={slaDeadline} />
          </div>
        </div>

        {/* Row 2: Summary */}
        <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', lineHeight: 1.45, marginBottom: 8 }}>
          {summary}
        </p>

        {/* Row 3: Location + source + language */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: historicalContext ? 6 : 10, flexWrap: 'wrap' }}>
          <MapPin size={11} style={{ color: '#9CA3AF', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#6B7280' }}>{location}</span>
          {source && (
            <>
              <span style={{ color: '#D1D5DB' }}>·</span>
              <Smartphone size={11} style={{ color: '#9CA3AF' }} />
              <span style={{ fontSize: 12, color: '#6B7280' }}>{source}</span>
            </>
          )}
          {language && language !== 'en' && (
            <LanguageChipCompact code={language} />
          )}
        </div>

        {/* Row 4: Historical context */}
        {historicalContext && (
          <div style={{
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            padding: '6px 10px',
            marginBottom: 10,
          }}>
            <p style={{ fontSize: 11, color: '#6B7280', fontStyle: 'italic', lineHeight: 1.5 }}>
              {historicalContext}
            </p>
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: '#F3F4F6', marginBottom: 10 }} />

        {/* Row 5: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
          <motion.button
            onClick={(e) => { e.stopPropagation(); onResolve?.(id) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0',
              cursor: 'pointer',
            }}
            whileHover={{ background: '#DCFCE7' }}
            whileTap={{ scale: 0.96 }}
          >
            <Check size={13} /> Resolve
          </motion.button>
          <motion.button
            onClick={(e) => { e.stopPropagation(); onReassign?.(id) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE',
              cursor: 'pointer',
            }}
            whileHover={{ background: '#DBEAFE' }}
            whileTap={{ scale: 0.96 }}
          >
            <ArrowRight size={13} /> Reassign
          </motion.button>
          <motion.button
            onClick={(e) => { e.stopPropagation(); onOverride?.(complaint) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: '#FFF7ED', color: '#D97706', border: '1px solid #FDE68A',
              cursor: 'pointer',
            }}
            whileHover={{ background: '#FEF3C7' }}
            whileTap={{ scale: 0.96 }}
          >
            <Edit3 size={13} /> Override AI
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
