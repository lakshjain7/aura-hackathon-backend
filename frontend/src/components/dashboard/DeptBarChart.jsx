import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'

const DEPT_DATA = [
  { name: 'GHMC Sanitation', avg: 3.2, breached: 4, target: 6, within: true },
  { name: 'HMWSSB Water', avg: 5.8, breached: 2, target: 8, within: true },
  { name: 'GHMC Roads', avg: 8.1, breached: 7, target: 6, within: false },
  { name: 'TSSPDCL Elec', avg: 4.5, breached: 1, target: 6, within: true },
  { name: 'City Police', avg: 7.2, breached: 5, target: 6, within: false },
  { name: 'GHMC Drainage', avg: 6.8, breached: 6, target: 6, within: false },
  { name: 'GHMC Parks', avg: 2.1, breached: 0, target: 12, within: true },
]

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg px-3 py-2 text-xs"
      style={{ background: 'var(--aura-bg-elevated)', border: '1px solid var(--aura-border)' }}>
      <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{d.name}</p>
      <p style={{ color: 'var(--text-secondary)' }}>Avg resolution: <span className="font-mono">{d.avg}h</span></p>
      <p style={{ color: 'var(--text-secondary)' }}>SLA target: <span className="font-mono">{d.target}h</span></p>
      <p style={{ color: d.within ? 'var(--sev-low)' : 'var(--sev-critical)' }}>
        {d.breached} SLA breaches
      </p>
    </div>
  )
}

export default function DeptBarChart({ data = DEPT_DATA, onBarClick }) {
  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--aura-bg-surface)', border: '1px solid var(--aura-border)' }}>
      <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Department Performance</h3>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 9, fill: 'var(--text-tertiary)' }}
            tickLine={false} axisLine={false}
            angle={-30} textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
            tickLine={false} axisLine={false}
            tickFormatter={v => `${v}h`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <ReferenceLine y={6} stroke="var(--text-tertiary)" strokeDasharray="4 4" label={{
            value: 'SLA Target', position: 'right', fontSize: 9, fill: 'var(--text-tertiary)',
          }} />
          <Bar
            dataKey="avg"
            radius={[4, 4, 0, 0]}
            cursor="pointer"
            onClick={(d) => onBarClick?.(d)}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.within ? '#22C55E' : '#EF4444'} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
