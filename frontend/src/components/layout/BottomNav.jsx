import { useLocation, useNavigate } from 'react-router-dom'
import { Inbox, GitMerge, CheckCircle, BarChart3, Settings } from 'lucide-react'

const items = [
  { path: '/officer', icon: Inbox, label: 'Queue' },
  { path: '/officer/clusters', icon: GitMerge, label: 'Clusters' },
  { path: '/officer/resolved', icon: CheckCircle, label: 'Resolved' },
  { path: '/officer/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/officer/settings', icon: Settings, label: 'Settings' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 flex items-center justify-around"
      style={{
        background: 'var(--aura-bg-surface)',
        borderTop: '1px solid var(--aura-border)',
      }}
    >
      {items.map((item) => {
        const active = location.pathname === item.path
        const Icon = item.icon
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center gap-0.5 py-1 px-3 min-w-[44px] min-h-[44px] justify-center cursor-pointer"
          >
            {active && (
              <span
                className="w-1 h-1 rounded-full mb-0.5"
                style={{ background: 'var(--aura-accent)' }}
              />
            )}
            <Icon size={20} style={{ color: active ? 'var(--text-primary)' : 'var(--text-tertiary)' }} />
            <span className="text-[9px]" style={{ color: active ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
