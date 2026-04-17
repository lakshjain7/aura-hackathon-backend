const STATUS_CONFIG = {
  pending: { label: 'Pending', bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' },
  processing: { label: 'Processing', bg: '#EEF0FF', color: '#5B4CF5', dot: '#5B4CF5' },
  in_progress: { label: 'In Progress', bg: '#FFF7ED', color: '#D97706', dot: '#D97706' },
  fix_applied: { label: 'Fix Applied', bg: '#F0FDF4', color: '#16A34A', dot: '#16A34A' },
  resolved: { label: 'Resolved', bg: '#F0FDF4', color: '#16A34A', dot: '#16A34A' },
  escalated: { label: 'Escalated', bg: '#FEF2F2', color: '#DC2626', dot: '#DC2626' },
  rejected: { label: 'Rejected', bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' },
  arrived: { label: 'Officer Arrived', bg: '#EFF6FF', color: '#2563EB', dot: '#2563EB' },
}

export default function StatusBadge({ status, size = 'md', pulse = false }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const fontSize = size === 'sm' ? 11 : 12
  const padding = size === 'sm' ? '2px 8px' : '4px 10px'
  const dotSize = size === 'sm' ? 5 : 6

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding, borderRadius: 20, fontSize, fontWeight: 600,
      background: config.bg, color: config.color,
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: dotSize, height: dotSize, borderRadius: '50%', background: config.dot,
        flexShrink: 0,
        animation: pulse && (status === 'in_progress' || status === 'processing') ? 'pulse 1.5s ease-in-out infinite' : 'none',
      }} />
      {config.label}
    </span>
  )
}
