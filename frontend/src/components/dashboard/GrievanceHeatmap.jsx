import { useState, useMemo } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

const severityColors = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#22C55E',
}

const MOCK_COMPLAINTS = Array.from({ length: 55 }, (_, i) => {
  const severities = ['critical', 'high', 'medium', 'low']
  const sev = severities[i < 8 ? 0 : i < 20 ? 1 : i < 38 ? 2 : 3]
  // Cluster around Ward 14 Madhapur for 18 complaints
  const isCluster = i < 18
  return {
    id: `GR-2026-${String(800 + i).padStart(4, '0')}`,
    lng: isCluster
      ? 78.38 + (Math.random() - 0.5) * 0.04
      : 78.2 + Math.random() * 0.4,
    lat: isCluster
      ? 17.44 + (Math.random() - 0.5) * 0.03
      : 17.2 + Math.random() * 0.4,
    severity: sev,
    category: ['Sanitation', 'Road', 'Water', 'Electricity', 'Drainage'][i % 5],
    timeAgo: `${Math.floor(Math.random() * 48)}h ago`,
  }
})

const CLUSTERS = [
  { id: 'CL-001', cx: 78.38, cy: 17.44, r: 0.03, count: 18, severity: 'critical', label: 'Ward 14 Sanitation' },
]

function CustomDot({ cx, cy, payload }) {
  if (!cx || !cy) return null
  const color = severityColors[payload.severity] || severityColors.low
  return (
    <circle cx={cx} cy={cy} r={5} fill={color} fillOpacity={0.8} stroke={color} strokeWidth={0.5} />
  )
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs"
      style={{ background: 'var(--aura-bg-elevated)', border: '1px solid var(--aura-border)' }}
    >
      <p className="font-mono font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{d.id}</p>
      <p style={{ color: severityColors[d.severity] }}>{d.severity.toUpperCase()} · {d.category}</p>
      <p style={{ color: 'var(--text-tertiary)' }}>{d.timeAgo}</p>
    </div>
  )
}

const severityFilters = ['all', 'critical', 'high', 'medium', 'low']

export default function GrievanceHeatmap({ data = MOCK_COMPLAINTS, showClusters = true }) {
  const [activeFilter, setActiveFilter] = useState('all')

  const filtered = useMemo(() =>
    activeFilter === 'all' ? data : data.filter(d => d.severity === activeFilter),
    [data, activeFilter]
  )

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--aura-bg-surface)', border: '1px solid var(--aura-border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--aura-border)' }}>
        <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Live Grievance Density Map — Hyderabad
        </h3>
        <div className="flex gap-1">
          {severityFilters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="px-2 py-1 rounded text-[10px] font-medium capitalize cursor-pointer"
              style={{
                background: activeFilter === f ? (f === 'all' ? 'var(--aura-accent-subtle)' : `${severityColors[f]}18`) : 'transparent',
                border: `1px solid ${activeFilter === f ? (f === 'all' ? 'var(--aura-accent)' : severityColors[f]) : 'var(--aura-border)'}`,
                color: activeFilter === f ? (f === 'all' ? 'var(--text-accent)' : severityColors[f]) : 'var(--text-tertiary)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: 520 }}>
        {/* SVG grid background */}
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.15 }}>
          {Array.from({ length: 20 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={`${(i + 1) * 5}%`} x2="100%" y2={`${(i + 1) * 5}%`}
              stroke="var(--aura-border)" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 30 }, (_, i) => (
            <line key={`v${i}`} x1={`${(i + 1) * 3.33}%`} y1="0" x2={`${(i + 1) * 3.33}%`} y2="100%"
              stroke="var(--aura-border)" strokeWidth="0.5" />
          ))}
        </svg>

        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <XAxis
              type="number" dataKey="lng" name="Longitude"
              domain={[78.2, 78.6]}
              tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
              tickLine={false} axisLine={false}
              tickFormatter={v => `${v.toFixed(1)}°E`}
            />
            <YAxis
              type="number" dataKey="lat" name="Latitude"
              domain={[17.2, 17.6]}
              tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
              tickLine={false} axisLine={false}
              tickFormatter={v => `${v.toFixed(1)}°N`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={filtered} shape={<CustomDot />} />
          </ScatterChart>
        </ResponsiveContainer>

        {/* Cluster overlays */}
        {showClusters && CLUSTERS.map(cluster => (
          <motion.div
            key={cluster.id}
            className="absolute pointer-events-none"
            style={{
              left: `${((cluster.cx - 78.2) / 0.4) * 100}%`,
              top: `${(1 - (cluster.cy - 17.2) / 0.4) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.5 }}
          >
            <div
              className="rounded-full flex items-center justify-center"
              style={{
                width: cluster.count * 5,
                height: cluster.count * 5,
                background: `${severityColors[cluster.severity]}18`,
                border: `1px solid ${severityColors[cluster.severity]}`,
              }}
            >
              <span className="text-[9px] font-mono font-bold" style={{ color: severityColors[cluster.severity] }}>
                {cluster.count}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
