import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie } from 'recharts'
import { CheckCircle, AlertTriangle, TrendingUp, Clock, Users, Zap, MapPin, Activity, Brain, Shield, ArrowUp, ArrowDown } from 'lucide-react'
import GrievanceHeatmap from '../../components/dashboard/GrievanceHeatmap'
import LiveFeed from '../../components/dashboard/LiveFeed'
import AgentVisualiser from '../../components/agent/AgentVisualiser'
import SeverityBadge from '../../components/shared/SeverityBadge'
import { useMockSSEStream } from '../../hooks/useSSEStream'
import { useToast } from '../../components/ui/Toast'
import { getAdminStats, getClusters, sendClusterAlert } from '../../utils/api'

const TABS = ['Overview', 'Clusters', 'Departments', 'Model', 'Live', 'Settings']

const ACCURACY_DATA = [
  { day: 'Mon', val: 92.1 }, { day: 'Tue', val: 92.8 }, { day: 'Wed', val: 93.2 },
  { day: 'Thu', val: 93.0 }, { day: 'Fri', val: 93.9 }, { day: 'Sat', val: 94.0 }, { day: 'Sun', val: 94.2 },
]

const DEPT_DATA = [
  { name: 'GHMC San.', total: 234, resolved: 189, color: '#5B4CF5' },
  { name: 'HMWSSB', total: 156, resolved: 98, color: '#2563EB' },
  { name: 'Roads', total: 197, resolved: 134, color: '#D97706' },
  { name: 'TSSPDCL', total: 89, resolved: 71, color: '#16A34A' },
  { name: 'City Police', total: 67, resolved: 45, color: '#DC2626' },
  { name: 'GHMC Other', total: 104, resolved: 76, color: '#7C3AED' },
]

const CATEGORY_DATA = [
  { name: 'Sanitation', value: 234, color: '#5B4CF5' },
  { name: 'Road & Infra', value: 197, color: '#D97706' },
  { name: 'Water Supply', value: 156, color: '#2563EB' },
  { name: 'Electricity', value: 112, color: '#F59E0B' },
  { name: 'Public Safety', value: 89, color: '#DC2626' },
  { name: 'Other', value: 59, color: '#6B7280' },
]

const CORRECTIONS = [
  { id: 'GR-2026-0832', from: 'Sanitation', to: 'Drainage', officer: 'Rajesh K.', time: '2h ago' },
  { id: 'GR-2026-0819', from: 'Road', to: 'Water Supply', officer: 'Priya M.', time: '5h ago' },
  { id: 'GR-2026-0801', from: 'Electricity', to: 'Public Safety', officer: 'Suresh R.', time: '8h ago' },
  { id: 'GR-2026-0798', from: 'Other', to: 'Sanitation', officer: 'Rajesh K.', time: '12h ago' },
  { id: 'GR-2026-0784', from: 'Water Supply', to: 'Drainage', officer: 'Anita S.', time: '1d ago' },
]

const MOCK_CLUSTERS = [
  { id: 'CL-001', status: 'active', severity: 'critical', location: 'Ward 14, Madhapur', pincode: '500081', count: 18, category: 'Sanitation', rootCause: 'Drainage infrastructure failure — heavy rainfall exposed cracked sewer mains on MG Road stretch', detected: '6h ago', img: '/images/garbage.jpeg' },
  { id: 'CL-002', status: 'active', severity: 'high', location: 'Ward 12, Gachibowli', pincode: '500032', count: 9, category: 'Water Supply', rootCause: 'Water pump station failure affecting 3 residential blocks', detected: '14h ago', img: '/images/streetlight.jpeg' },
  { id: 'CL-003', status: 'resolved', severity: 'medium', location: 'Ward 8, Kondapur', pincode: '500084', count: 6, category: 'Electricity', rootCause: 'Street light transformer blown after power surge', detected: '3d ago', img: '/images/pothole.jpeg' },
]

const MOCK_STATS = {
  total_today: 847,
  resolved_today: 312,
  avg_resolution_hrs: 2.4,
  active_clusters: 3,
}

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>
      {time.toLocaleTimeString('en-IN', { hour12: false })}
    </span>
  )
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [stats, setStats] = useState(MOCK_STATS)
  const [clusters, setClusters] = useState(MOCK_CLUSTERS)
  const navigate = useNavigate()
  const { nodeStates, events, runPipeline } = useMockSSEStream()

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, clustersRes] = await Promise.all([getAdminStats(), getClusters()])
        setStats(statsRes.data)
        if (Array.isArray(clustersRes.data) && clustersRes.data.length > 0) setClusters(clustersRes.data)
      } catch {
        // demo mode
      }
    }
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (activeTab === 'Live') runPipeline('normal')
  }, [activeTab])

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'var(--font-sans)' }}>

      {/* ── Top Nav ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30, height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px',
        background: 'rgba(15,15,26,0.96)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: '#5B4CF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: 14, fontFamily: 'var(--font-mono)' }}>A</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'white', letterSpacing: '-0.01em' }}>AURA</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 4 }}>Intelligence Centre</span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: activeTab === tab ? 'rgba(91,76,245,0.2)' : 'transparent',
                color: activeTab === tab ? '#A78BFA' : 'rgba(255,255,255,0.45)',
              }}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'inline-block', boxShadow: '0 0 8px #22C55E' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#22C55E', letterSpacing: '0.06em' }}>LIVE</span>
          </div>
          <LiveClock />
        </div>
      </header>

      {/* ── Page content ── */}
      <main style={{ paddingTop: 56 }}>
        <AnimatePresence mode="wait">
          {activeTab === 'Overview' && <OverviewTab key="overview" stats={stats} />}
          {activeTab === 'Clusters' && <ClustersTab key="clusters" clusters={clusters} />}
          {activeTab === 'Live' && <LiveTab key="live" nodeStates={nodeStates} events={events} />}
          {activeTab === 'Model' && <ModelTab key="model" />}
          {activeTab === 'Departments' && <DepartmentsTab key="departments" />}
          {activeTab === 'Settings' && <SettingsTab key="settings" />}
        </AnimatePresence>
      </main>
    </div>
  )
}

/* ─────────────────────────────────────────
   OVERVIEW TAB
───────────────────────────────────────── */
function OverviewTab({ stats }) {
  const s = stats || MOCK_STATS
  const resolvedPct = s.total_today > 0 ? Math.round((s.resolved_today / s.total_today) * 100) : 37

  return (
    <div>
      {/* Hero banner */}
      <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
        <img
          src="/images/aerial.jpeg"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%', filter: 'brightness(0.5)' }}
          alt=""
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(91,76,245,0.80) 0%, rgba(15,15,26,0.70) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 36px', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', marginBottom: 6 }}>
              GREATER HYDERABAD MUNICIPAL CORPORATION
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Grievance Intelligence Centre
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
              Real-time AI-powered civic issue monitoring · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
            {[
              { label: 'Wards covered', value: '150+' },
              { label: 'Departments', value: '12' },
              { label: 'AI accuracy', value: '94.2%' },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '10px 20px', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'white', fontFamily: 'var(--font-mono)' }}>{item.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 36px' }}>

        {/* ── Stat cards row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            {
              icon: Activity, color: '#5B4CF5', bg: '#EDE9FE', label: 'Total today',
              value: s.total_today, suffix: 'complaints', trend: '+12%', up: true,
              img: '/images/city.jpeg',
            },
            {
              icon: CheckCircle, color: '#16A34A', bg: '#DCFCE7', label: 'Resolved',
              value: s.resolved_today, suffix: `${resolvedPct}% rate`, trend: '+8%', up: true,
              img: '/images/meeting.jpeg',
            },
            {
              icon: Clock, color: '#2563EB', bg: '#DBEAFE', label: 'Avg resolution',
              value: s.avg_resolution_hrs, suffix: 'hours', trend: '-18%', up: false,
              img: '/images/govtindia.jpeg',
            },
            {
              icon: AlertTriangle, color: '#DC2626', bg: '#FEE2E2', label: 'Active clusters',
              value: s.active_clusters, suffix: 'systemic issues', trend: null, pulse: true,
              img: '/images/aerial.jpeg',
            },
          ].map((card, i) => {
            const Icon = card.icon
            return (
              <div key={i} style={{
                background: 'white', borderRadius: 16, overflow: 'hidden',
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}>
                {/* Image strip */}
                <div style={{ height: 72, position: 'relative', overflow: 'hidden' }}>
                  <img src={card.img} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', filter: 'brightness(0.55) saturate(0.8)' }} alt="" />
                  <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${card.color}BB, ${card.color}55)` }} />
                  <div style={{ position: 'absolute', top: 12, left: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} color="white" />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</span>
                  </div>
                </div>

                {/* Number */}
                <div style={{ padding: '14px 16px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 34, fontWeight: 800, color: '#111827', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>
                      {card.value}
                    </span>
                    {card.pulse && (
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#DC2626', marginBottom: 8, flexShrink: 0, boxShadow: '0 0 0 3px rgba(220,38,38,0.2)' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>{card.suffix}</span>
                    {card.trend && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 20, background: card.up ? '#F0FDF4' : '#FFF7ED', border: `1px solid ${card.up ? '#BBF7D0' : '#FDE68A'}` }}>
                        {card.up ? <ArrowUp size={10} color="#16A34A" /> : <ArrowDown size={10} color="#D97706" />}
                        <span style={{ fontSize: 11, fontWeight: 700, color: card.up ? '#16A34A' : '#D97706' }}>{card.trend}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Main content: 3-column grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 340px', gap: 20, marginBottom: 20 }}>

          {/* Dept performance bar chart */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 2 }}>Department Performance</h3>
                <p style={{ fontSize: 12, color: '#6B7280' }}>Complaints received vs. resolved</p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                {[{ color: '#5B4CF5', label: 'Total' }, { color: '#BBF7D0', label: 'Resolved' }].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                    <span style={{ fontSize: 11, color: '#6B7280' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '8px 12px 16px' }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={DEPT_DATA} barGap={4}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }}
                    cursor={{ fill: 'rgba(91,76,245,0.05)' }}
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {DEPT_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                  <Bar dataKey="resolved" radius={[4, 4, 0, 0]}>
                    {DEPT_DATA.map((d, i) => <Cell key={i} fill={`${d.color}40`} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category breakdown */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px 0', marginBottom: 4 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 2 }}>Category Breakdown</h3>
              <p style={{ fontSize: 12, color: '#6B7280' }}>Today's complaint distribution</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', padding: '8px 20px 16px', gap: 20 }}>
              <div style={{ flexShrink: 0 }}>
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={CATEGORY_DATA} cx="50%" cy="50%" innerRadius={38} outerRadius={62} dataKey="value" paddingAngle={2}>
                      {CATEGORY_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1 }}>
                {CATEGORY_DATA.map((cat, i) => {
                  const total = CATEGORY_DATA.reduce((a, c) => a + c.value, 0)
                  const pct = Math.round((cat.value / total) * 100)
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: cat.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: '#374151', flex: 1 }}>{cat.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#111827', fontFamily: 'var(--font-mono)' }}>{cat.value}</span>
                      <span style={{ fontSize: 11, color: cat.value > 150 ? '#DC2626' : '#6B7280', width: 32, textAlign: 'right' }}>+{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* AI Accuracy panel */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            {/* Image header */}
            <div style={{ position: 'relative', height: 90, overflow: 'hidden' }}>
              <img src="/images/meeting.jpeg" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', filter: 'brightness(0.5)' }} alt="" />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(22,163,74,0.85), rgba(5,150,105,0.70))' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 10 }}>
                <Brain size={20} color="rgba(255,255,255,0.9)" />
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>AI MODEL HEALTH</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>Good · Trending upward</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 40, fontWeight: 800, color: '#16A34A', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>94.2%</span>
                <span style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>accuracy</span>
              </div>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>142 complaints · 8 corrections this week</p>

              <div style={{ height: 40, marginBottom: 14 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ACCURACY_DATA}>
                    <Area type="monotone" dataKey="val" stroke="#16A34A" fill="#DCFCE7" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent corrections</p>
                {CORRECTIONS.slice(0, 3).map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 11 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#9CA3AF', fontSize: 10 }}>{c.id.slice(-4)}</span>
                    <span style={{ color: '#DC2626', fontWeight: 600 }}>{c.from}</span>
                    <span style={{ color: '#9CA3AF' }}>→</span>
                    <span style={{ color: '#16A34A', fontWeight: 600 }}>{c.to}</span>
                    <span style={{ marginLeft: 'auto', color: '#9CA3AF' }}>{c.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom row: Heatmap + Live complaints ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>

          {/* Heatmap */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Live Grievance Density Map</h3>
                <p style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>Hyderabad metropolitan area · Ward-level resolution</p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[['#DC2626', 'Critical'], ['#EA580C', 'High'], ['#D97706', 'Medium'], ['#16A34A', 'Low']].map(([c, l]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                    <span style={{ fontSize: 11, color: '#6B7280' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ height: 280 }}>
              <GrievanceHeatmap />
            </div>
          </div>

          {/* Active cluster summary */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            {/* Image header */}
            <div style={{ position: 'relative', height: 80, overflow: 'hidden' }}>
              <img src="/images/city.jpeg" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 60%', filter: 'brightness(0.45)' }} alt="" />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(220,38,38,0.80), rgba(234,88,12,0.60))' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8 }}>
                <AlertTriangle size={18} color="rgba(255,255,255,0.9)" />
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>SYSTEMIC ALERTS</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>3 active clusters detected</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '12px 16px' }}>
              {MOCK_CLUSTERS.map((cl, i) => (
                <div key={cl.id} style={{
                  padding: '10px 12px', borderRadius: 10, marginBottom: 8,
                  background: cl.status === 'active' ? (cl.severity === 'critical' ? '#FFF1F1' : '#FFF7ED') : '#F0FDF4',
                  border: `1px solid ${cl.status === 'active' ? (cl.severity === 'critical' ? '#FECACA' : '#FDE68A') : '#BBF7D0'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: cl.status === 'active' ? (cl.severity === 'critical' ? '#DC2626' : '#EA580C') : '#16A34A', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{cl.location}</span>
                    <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: '#9CA3AF' }}>{cl.detected}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
                    {cl.count} {cl.category} complaints · {cl.pincode}
                  </div>
                  <p style={{ fontSize: 11, color: '#374151', lineHeight: 1.4, fontStyle: 'italic' }}>
                    {cl.rootCause.slice(0, 70)}…
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   CLUSTERS TAB
───────────────────────────────────────── */
function ClustersTab({ clusters }) {
  const { addToast } = useToast()
  const clusterList = clusters || MOCK_CLUSTERS

  const handleAlert = async (id) => {
    try {
      await sendClusterAlert(id)
      addToast('Proactive alert sent to Ward Councillor', 'success')
    } catch {
      addToast('Alert sent (demo mode)', 'success')
    }
  }

  return (
    <div style={{ padding: '28px 36px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Systemic Issue Clusters</h2>
        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>AI-detected patterns of recurring complaints across wards</p>
      </div>

      {/* Summary banner */}
      <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', marginBottom: 24, border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ position: 'relative', height: 100, overflow: 'hidden' }}>
          <img src="/images/aerial.jpeg" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 50%', filter: 'brightness(0.4)' }} alt="" />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(91,76,245,0.85) 0%, transparent 60%)' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 40 }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginBottom: 4 }}>AURA SYSTEMIC INTELLIGENCE</div>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>
                {clusterList.filter(c => c.status === 'active').length} active clusters · {clusterList.reduce((a, c) => a + c.count, 0)} total complaints flagged
              </p>
            </div>
            {[
              { v: clusterList.filter(c => c.status === 'active').length, l: 'Active' },
              { v: clusterList.filter(c => c.severity === 'critical').length, l: 'Critical' },
              { v: clusterList.filter(c => c.status === 'resolved').length, l: 'Resolved' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'white', fontFamily: 'var(--font-mono)' }}>{s.v}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cluster cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {clusterList.map(cluster => (
          <div
            key={cluster.id}
            style={{
              background: 'white', borderRadius: 16, border: '1px solid #E2E8F0',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden',
              borderLeft: `4px solid ${cluster.severity === 'critical' ? '#DC2626' : cluster.severity === 'high' ? '#EA580C' : '#D97706'}`,
            }}
          >
            <div style={{ display: 'flex', gap: 0 }}>
              {/* Image column */}
              <div style={{ width: 140, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                <img
                  src={cluster.img || '/images/garbage.jpeg'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6) saturate(0.8)', minHeight: 140 }}
                  alt=""
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 60%, white)' }} />
                <div style={{ position: 'absolute', top: 12, left: 12 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                    background: cluster.status === 'active' ? '#DC2626' : '#16A34A',
                    color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{cluster.status}</span>
                </div>
                <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.8)' }}>{cluster.id}</span>
                </div>
              </div>

              {/* Content */}
              <div style={{ flex: 1, padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                        background: cluster.severity === 'critical' ? '#FEE2E2' : cluster.severity === 'high' ? '#FFF7ED' : '#FEF9C3',
                        color: cluster.severity === 'critical' ? '#DC2626' : cluster.severity === 'high' ? '#EA580C' : '#D97706',
                        border: `1px solid ${cluster.severity === 'critical' ? '#FECACA' : cluster.severity === 'high' ? '#FDE68A' : '#FEF08A'}`,
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                      }}>{cluster.severity}</span>
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>Detected {cluster.detected}</span>
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                      {cluster.count} complaints · {cluster.location}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                      <MapPin size={12} style={{ color: '#9CA3AF' }} />
                      <span style={{ fontSize: 12, color: '#6B7280' }}>{cluster.pincode} · {cluster.category}</span>
                    </div>
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px' }}>
                      <p style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>AI Root Cause Analysis</p>
                      <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{cluster.rootCause}</p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                    <button style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#374151', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      View all
                    </button>
                    {cluster.status === 'active' && (
                      <>
                        <button style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          Mark resolved
                        </button>
                        <button
                          onClick={() => handleAlert(cluster.id)}
                          style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#EA580C', border: 'none', color: 'white', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Alert councillor
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   DEPARTMENTS TAB
───────────────────────────────────────── */
function DepartmentsTab() {
  return (
    <div style={{ padding: '28px 36px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Department Performance</h2>
        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>Resolution rates and SLA compliance across all departments</p>
      </div>

      {/* Image banner */}
      <div style={{ position: 'relative', height: 120, borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
        <img src="/images/indian government ward office.jpeg" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', filter: 'brightness(0.4)' }} alt="" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(91,76,245,0.90) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 28px' }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginBottom: 4 }}>DEPARTMENT INTELLIGENCE</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>12 departments · 847 complaints today</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {DEPT_DATA.map((dept, i) => {
          const rate = Math.round((dept.resolved / dept.total) * 100)
          return (
            <div key={i} style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 20, borderTop: `3px solid ${dept.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{dept.name}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: rate > 70 ? '#16A34A' : '#DC2626', fontFamily: 'var(--font-mono)' }}>{rate}%</span>
              </div>
              <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${rate}%`, background: dept.color, borderRadius: 3 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280' }}>
                <span>{dept.total} received</span>
                <span style={{ color: '#16A34A', fontWeight: 600 }}>{dept.resolved} resolved</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   MODEL TAB
───────────────────────────────────────── */
function ModelTab() {
  return (
    <div style={{ padding: '28px 36px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>AI Model Performance</h2>
        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>Classification accuracy, RLHF corrections, and model health</p>
      </div>

      {/* Hero */}
      <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', marginBottom: 20, border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ position: 'relative', height: 100, overflow: 'hidden' }}>
          <img src="/images/meeting.jpeg" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', filter: 'brightness(0.4)' }} alt="" />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(22,163,74,0.90) 0%, transparent 55%)' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>CLASSIFICATION ACCURACY</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'white', fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>94.2%</div>
            </div>
            <div style={{ width: 1, height: 50, background: 'rgba(255,255,255,0.2)' }} />
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Last correction</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>2 hours ago</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>This week</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>8 corrections</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Model status</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#86EFAC' }}>● Healthy</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Weekly Accuracy Trend</h4>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={ACCURACY_DATA}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis domain={[91, 95]} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="val" stroke="#16A34A" fill="#DCFCE7" strokeWidth={2.5} dot={{ fill: '#16A34A', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Correction log */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>RLHF Correction Log</h3>
          <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Officer-submitted corrections used for model fine-tuning</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['Complaint ID', 'AI Predicted', '', 'Corrected To', 'Officer', 'Time'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CORRECTIONS.map((c, i) => (
              <tr key={c.id} style={{ borderTop: '1px solid #F3F4F6', background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#5B4CF5' }}>{c.id}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: '#FEE2E2', color: '#DC2626', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>{c.from}</span>
                </td>
                <td style={{ padding: '12px 8px', color: '#9CA3AF', fontSize: 16 }}>→</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: '#DCFCE7', color: '#16A34A', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>{c.to}</span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>{c.officer}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-mono)' }}>{c.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   LIVE TAB
───────────────────────────────────────── */
function LiveTab({ nodeStates, events }) {
  return (
    <div style={{ padding: '28px 36px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Live Pipeline Monitor</h2>
        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>Real-time AI agent activity and incoming complaint stream</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Incoming Complaints</h3>
          </div>
          <div style={{ padding: 16 }}>
            <LiveFeed />
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Active Agent Pipeline</h3>
          </div>
          <div style={{ padding: 16 }}>
            <AgentVisualiser
              nodeStates={nodeStates}
              events={events}
              translationInfo={{
                fromLang: 'hi',
                fromScript: 'हिंदी',
                fromText: 'हमारे वार्ड 14 में 5 दिनों से कूड़ा नहीं उठाया',
                toText: 'Garbage not collected in Ward 14 for 5 days',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   SETTINGS TAB
───────────────────────────────────────── */
function SettingsTab() {
  return (
    <div style={{ padding: '28px 36px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>Settings</h2>
        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>Configure SLA thresholds, notification rules, and department mappings</p>
      </div>
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚙️</div>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Settings panel coming soon</p>
        <p style={{ fontSize: 13, color: '#9CA3AF' }}>Configure notifications, SLA thresholds, department mappings, and officer assignments.</p>
      </div>
    </div>
  )
}
