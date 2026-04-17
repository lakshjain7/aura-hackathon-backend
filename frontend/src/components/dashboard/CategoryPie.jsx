import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const CATEGORY_DATA = [
  { name: 'Sanitation', value: 234, color: '#EF4444', change: '+12%' },
  { name: 'Road & Infra', value: 187, color: '#F97316', change: '+5%' },
  { name: 'Water Supply', value: 156, color: '#3B82F6', change: '-3%' },
  { name: 'Electricity', value: 112, color: '#EAB308', change: '+8%' },
  { name: 'Public Safety', value: 89, color: '#8B5CF6', change: '+2%' },
  { name: 'Other', value: 69, color: '#6B7280', change: '-1%' },
]

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg px-3 py-2 text-xs"
      style={{ background: 'var(--aura-bg-elevated)', border: '1px solid var(--aura-border)' }}>
      <p className="font-medium" style={{ color: d.color }}>{d.name}</p>
      <p style={{ color: 'var(--text-primary)' }}>{d.value} complaints</p>
    </div>
  )
}

export default function CategoryPie({ data = CATEGORY_DATA }) {
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--aura-bg-surface)', border: '1px solid var(--aura-border)' }}>
      <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Category Breakdown</h3>

      <div className="flex items-center gap-6">
        <div className="relative" style={{ width: 200, height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%" cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="value"
                stroke="none"
                paddingAngle={2}
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Total</span>
            <span className="font-mono text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{total}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
              <span className="flex-1" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
              <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{d.value}</span>
              <span className="font-mono text-[10px]"
                style={{ color: d.change.startsWith('+') ? 'var(--sev-low)' : 'var(--sev-critical)' }}>
                {d.change}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
