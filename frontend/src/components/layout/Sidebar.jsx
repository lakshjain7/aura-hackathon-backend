import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { Inbox, GitMerge, CheckCircle, BarChart3, Settings, LogOut } from 'lucide-react'

const navItems = [
  { path: '/officer', icon: Inbox, label: 'Queue', badge: 'openCount' },
  { path: '/officer/clusters', icon: GitMerge, label: 'Clusters', badge: 'clusterCount' },
  { path: '/officer/resolved', icon: CheckCircle, label: 'Resolved', badge: 'resolvedCount' },
  { path: '/officer/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/officer/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ officer = {}, badges = {}, accuracy = 94.2 }) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <aside
      className="hidden md:flex flex-col w-60 h-screen fixed left-0 top-0 z-30 p-4"
      style={{
        background: 'var(--aura-bg-surface)',
        borderRight: '1px solid var(--aura-border)',
      }}
    >
      {/* Logo */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <motion.div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: 'var(--aura-accent-subtle)', border: '1px solid var(--aura-accent)' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <polygon points="7,1 13,4 13,10 7,13 1,10 1,4" stroke="var(--aura-accent)" strokeWidth="1" fill="none" />
            </svg>
          </motion.div>
          <span className="text-base font-medium tracking-tight" style={{ color: 'var(--text-primary)' }}>AURA</span>
        </div>
        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {officer.name || 'Rajesh K.'}
        </div>
        <div className="text-xs font-mono" style={{ color: 'var(--text-accent)' }}>
          {officer.department || 'GHMC Sanitation'}
        </div>
        <div
          className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px]"
          style={{ background: 'var(--aura-bg-elevated)', border: '1px solid var(--aura-border)', color: 'var(--text-tertiary)' }}
        >
          Madhapur Zone · Ward 14
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path
          const Icon = item.icon
          const badgeValue = item.badge ? badges[item.badge] : null

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer relative"
              style={{
                background: active ? 'var(--aura-accent-subtle)' : 'transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              {active && (
                <motion.div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{ background: 'var(--aura-accent)' }}
                  layoutId="sidebar-active"
                />
              )}
              <Icon size={18} />
              <span className="flex-1 text-left">{item.label}</span>
              {badgeValue != null && (
                <span
                  className="min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-[10px] font-mono font-bold"
                  style={{
                    background: item.badge === 'clusterCount' && badgeValue > 0 ? 'var(--sev-critical-bg)' : 'var(--aura-accent-subtle)',
                    color: item.badge === 'clusterCount' && badgeValue > 0 ? 'var(--sev-critical)' : 'var(--text-accent)',
                    border: `1px solid ${item.badge === 'clusterCount' && badgeValue > 0 ? 'var(--sev-critical-border)' : 'var(--aura-accent-glow)'}`,
                  }}
                >
                  {badgeValue}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom: Accuracy + Logout */}
      <div className="mt-auto pt-4 border-t" style={{ borderColor: 'var(--aura-border)' }}>
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Accuracy</span>
          <span className="font-mono text-xs font-medium" style={{ color: 'var(--text-accent)' }}>{accuracy}%</span>
        </div>
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all cursor-pointer"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </aside>
  )
}
