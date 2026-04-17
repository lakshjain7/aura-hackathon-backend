import { Bell } from 'lucide-react'
import LanguagePicker from '../language/LanguagePicker'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function TopBar({ name = 'Rajesh', stats = {} }) {
  const date = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <header
      className="fixed top-0 right-0 left-0 md:left-60 z-20 h-14 flex items-center justify-between px-4 md:px-6"
      style={{
        background: 'var(--aura-bg-overlay)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--aura-border)',
        position: 'fixed',
      }}
    >
      <img src="/images/complaint.jpg" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.03, pointerEvents: 'none' }} alt="" />
      {/* Left */}
      <div>
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {getGreeting()}, {name}
        </span>
        <span className="text-xs ml-3 hidden sm:inline" style={{ color: 'var(--text-tertiary)' }}>
          {date}
        </span>
      </div>

      {/* Center: status pills */}
      <div className="hidden md:flex items-center gap-2">
        <StatusPill color="var(--aura-accent)" label={`${stats.open || 0} open`} />
        <StatusPill color="var(--sev-critical)" label={`${stats.critical || 0} critical`} pulse={stats.critical > 0} />
        <StatusPill color="var(--sev-medium)" label={`${stats.nearSLA || 0} near SLA`} />
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
          <Bell size={18} />
          {stats.notifications > 0 && (
            <span
              className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: 'var(--sev-critical)', color: 'white' }}
            >
              {stats.notifications}
            </span>
          )}
        </button>
        <div className="hidden lg:block">
          <LanguagePicker compact />
        </div>
      </div>
    </header>
  )
}

function StatusPill({ color, label, pulse }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
      style={{
        background: `${color}10`,
        border: `1px solid ${color}30`,
        color,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{
          background: color,
          animation: pulse ? 'blink 1s infinite' : 'none',
        }}
      />
      {label}
    </span>
  )
}
