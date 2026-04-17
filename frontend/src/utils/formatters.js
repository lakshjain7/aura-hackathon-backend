export function formatTimeAgo(date) {
  const now = new Date()
  const diff = Math.floor((now - new Date(date)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function formatSLATime(deadlineTimestamp) {
  const now = new Date()
  const deadline = new Date(deadlineTimestamp)
  const diff = deadline - now
  if (diff <= 0) return { text: 'SLA BREACHED', severity: 'breached' }
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  if (hours >= 24) return { text: `${hours}h ${minutes}m`, severity: 'normal' }
  if (hours >= 2) return { text: `${hours}h ${String(minutes).padStart(2, '0')}m`, severity: 'warning' }
  return { text: `${hours > 0 ? hours + 'h ' : ''}${minutes}m`, severity: 'critical' }
}

export function generateComplaintId() {
  const year = new Date().getFullYear()
  const num = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')
  return `GR-${year}-${num}`
}

export function formatTimestamp(date) {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
}
