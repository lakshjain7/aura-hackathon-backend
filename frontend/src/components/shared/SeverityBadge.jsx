import { SEVERITY_LEVELS } from '../../utils/constants'

const sizes = {
  sm: 'text-[10px] h-5 px-2 gap-1',
  md: 'text-xs h-6 px-2.5 gap-1.5',
  lg: 'text-[13px] h-7 px-3 gap-1.5',
}

export default function SeverityBadge({ severity, size = 'md' }) {
  const sev = SEVERITY_LEVELS[severity] || SEVERITY_LEVELS.pending

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium uppercase tracking-wider ${sizes[size]}`}
      style={{
        background: sev.bg,
        border: `1px solid ${sev.border}`,
        color: sev.color,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: sev.color }}
      />
      {sev.label}
    </span>
  )
}
