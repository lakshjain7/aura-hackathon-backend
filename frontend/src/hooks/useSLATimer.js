import { useState, useEffect } from 'react'
import { formatSLATime } from '../utils/formatters'

export function useSLATimer(deadlineTimestamp) {
  const [sla, setSla] = useState(() => formatSLATime(deadlineTimestamp))

  useEffect(() => {
    if (!deadlineTimestamp) return
    const interval = setInterval(() => {
      setSla(formatSLATime(deadlineTimestamp))
    }, 60000)
    setSla(formatSLATime(deadlineTimestamp))
    return () => clearInterval(interval)
  }, [deadlineTimestamp])

  return sla
}
