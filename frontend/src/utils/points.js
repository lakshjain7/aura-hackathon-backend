export const IMPACT_POINTS = {
  SUBMIT_COMPLAINT: 100,
  CONFIRM_RESOLUTION: 20,
  REJECT_FALSE_RESOLUTION: 50,
  REGISTER: 50,
  UPLOAD_PHOTO: 15,
  VOICE_REPORT: 10,
  SHARE_TRACKING: 5,
}

export function getImpactPoints() {
  return parseInt(localStorage.getItem('aura_points') || '0', 10)
}

export function getPointsLog() {
  try {
    return JSON.parse(localStorage.getItem('aura_points_log') || '[]')
  } catch {
    return []
  }
}

export function addPoints(amount, reason) {
  const current = getImpactPoints()
  const next = current + amount
  localStorage.setItem('aura_points', String(next))
  const log = getPointsLog()
  log.unshift({ amount, reason, ts: Date.now() })
  localStorage.setItem('aura_points_log', JSON.stringify(log.slice(0, 50)))
  return next
}
