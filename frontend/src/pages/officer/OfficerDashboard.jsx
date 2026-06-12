import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Search, Inbox, GitMerge, CheckCircle, BarChart3, Settings, X, AlertTriangle, TrendingUp, Clock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import ComplaintCard from '../../components/complaint/ComplaintCard'
import OverrideModal from '../../components/complaint/OverrideModal'
import { useToast } from '../../components/ui/Toast'
import { getOfficerAssignments, submitCheckpoint, correctComplaint, pingGPS, reassignComplaint } from '../../utils/api'

const MOCK_COMPLAINTS = [
  { id: 'GR-2026-0847', severity: 'critical', category: 'Sanitation', summary: 'Garbage not collected for 5 days, Ward 14, causing health hazard', location: 'Ward 14, Madhapur, Hyderabad', language: 'hi', source: 'WhatsApp', slaDeadline: new Date(Date.now() + 2 * 3600000).toISOString(), historicalContext: '7 similar in this area/30 days · avg 6hr resolution', confidence: 94 },
  { id: 'GR-2026-0848', severity: 'high', category: 'Water Supply', summary: 'No water supply since yesterday morning in entire colony', location: 'Ward 12, Gachibowli, Hyderabad', language: 'te', source: 'Web', slaDeadline: new Date(Date.now() + 8 * 3600000).toISOString(), historicalContext: '3 similar in this area/7 days', confidence: 89 },
  { id: 'GR-2026-0849', severity: 'high', category: 'Road & Infrastructure', summary: 'Large pothole on main road causing accidents near school', location: 'Ward 14, Madhapur, Hyderabad', language: 'en', source: 'Web', slaDeadline: new Date(Date.now() + 12 * 3600000).toISOString(), historicalContext: '2 similar reports this week', confidence: 91 },
  { id: 'GR-2026-0850', severity: 'medium', category: 'Electricity', summary: 'Street lights not working on Ring Road stretch near Biodiversity Park', location: 'Ward 10, Raidurg, Hyderabad', language: 'en', source: 'Web', slaDeadline: new Date(Date.now() + 36 * 3600000).toISOString(), confidence: 87 },
  { id: 'GR-2026-0851', severity: 'medium', category: 'Drainage', summary: 'Sewage overflow on street, foul smell affecting residents', location: 'Ward 14, Madhapur, Hyderabad', language: 'hi', source: 'WhatsApp', slaDeadline: new Date(Date.now() + 24 * 3600000).toISOString(), historicalContext: 'Part of Ward 14 cluster (18 complaints)', confidence: 92 },
  { id: 'GR-2026-0852', severity: 'low', category: 'Parks & Recreation', summary: 'Park bench broken and swings need repair', location: 'Ward 8, Kondapur, Hyderabad', language: 'en', source: 'Web', slaDeadline: new Date(Date.now() + 72 * 3600000).toISOString(), confidence: 96 },
  { id: 'GR-2026-0853', severity: 'critical', category: 'Water Supply', summary: 'Contaminated water coming from taps, children falling sick', location: 'Ward 14, Madhapur, Hyderabad', language: 'te', source: 'WhatsApp', slaDeadline: new Date(Date.now() + 1 * 3600000).toISOString(), historicalContext: 'Part of Ward 14 cluster', confidence: 97 },
]

const MOCK_CLUSTERS = [
  { id: 'CL-001', area: 'Ward 14, Madhapur', type: 'Sanitation', count: 18, severity: 'critical', aiDiagnosis: 'Cracked sewer mains on MG Road stretch — infrastructure failure confirmed', lastActivity: '2 hours ago', councillor: 'Smt. Lakshmi Devi' },
  { id: 'CL-002', area: 'Ward 12, Gachibowli', type: 'Water Supply', count: 7, severity: 'high', aiDiagnosis: 'Pressure drop in main line — possible leak near Outer Ring Road junction', lastActivity: '5 hours ago', councillor: 'Sri. Venkat Rao' },
  { id: 'CL-003', area: 'Ward 10, Raidurg', type: 'Electricity', count: 5, severity: 'medium', aiDiagnosis: 'Transformer overloaded — 3 feeders affected in evening peak hours', lastActivity: '1 day ago', councillor: 'Sri. Ramesh Kumar' },
]

const MOCK_OFFICERS = [
  { id: 'OFF-001', name: 'Priya S.', zone: 'Ward 12, Gachibowli', load: 3 },
  { id: 'OFF-002', name: 'Suresh M.', zone: 'Ward 10, Raidurg', load: 5 },
  { id: 'OFF-003', name: 'Anita R.', zone: 'Ward 8, Kondapur', load: 2 },
  { id: 'OFF-004', name: 'Kumar V.', zone: 'Ward 16, Jubilee Hills', load: 4 },
]

const ANALYTICS_WEEKLY = [
  { day: 'Mon', resolved: 12, escalated: 2 },
  { day: 'Tue', resolved: 8, escalated: 1 },
  { day: 'Wed', resolved: 15, escalated: 3 },
  { day: 'Thu', resolved: 10, escalated: 0 },
  { day: 'Fri', resolved: 18, escalated: 2 },
  { day: 'Sat', resolved: 14, escalated: 1 },
  { day: 'Sun', resolved: 7, escalated: 0 },
]

const FILTERS = ['All', 'Critical', 'High', 'Medium', 'Low', 'Unclassified']

const NAV_VIEWS = [
  { view: 'queue', icon: Inbox, label: 'Queue', badgeKey: 'openCount' },
  { view: 'clusters', icon: GitMerge, label: 'Clusters', badgeKey: 'clusterCount' },
  { view: 'resolved', icon: CheckCircle, label: 'Resolved', badgeKey: 'resolvedCount' },
  { view: 'analytics', icon: BarChart3, label: 'Analytics' },
  { view: 'settings', icon: Settings, label: 'Settings' },
]

const SEV_COLORS = { critical: '#DC2626', high: '#EA580C', medium: '#CA8A04', low: '#16A34A' }

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function OfficerDashboard() {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [activeView, setActiveView] = useState('queue')
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [overrideComplaint, setOverrideComplaint] = useState(null)
  const [clusterDismissed, setClusterDismissed] = useState(false)
  const [complaints, setComplaints] = useState(MOCK_COMPLAINTS)
  const [loading, setLoading] = useState(false)
  const [activeComplaintId, setActiveComplaintId] = useState(null)
  const [reassignModal, setReassignModal] = useState({ open: false, complaint: null, selectedOfficer: null })
  const [resolvedComplaints, setResolvedComplaints] = useState([])

  const officerId = localStorage.getItem('aura_officer_id') || 'demo'
  const officerName = localStorage.getItem('aura_officer_name') || 'Rajesh K.'

  useEffect(() => {
    const fetchQueue = async () => {
      setLoading(true)
      try {
        const res = await getOfficerAssignments(officerId)
        const data = res.data.assignments || res.data
        if (Array.isArray(data) && data.length > 0) setComplaints(data)
        else setComplaints(MOCK_COMPLAINTS)
      } catch {
        setComplaints(MOCK_COMPLAINTS)
      }
      setLoading(false)
    }
    fetchQueue()
    const interval = setInterval(fetchQueue, 30000)
    return () => clearInterval(interval)
  }, [officerId])

  useEffect(() => {
    if (!navigator.geolocation) return
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        pingGPS({ officer_id: officerId, lat: pos.coords.latitude, lng: pos.coords.longitude, complaint_id: activeComplaintId || null }).catch(() => {})
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [officerId, activeComplaintId])

  const filteredComplaints = complaints.filter(c => {
    if (activeFilter !== 'All' && activeFilter !== 'Unclassified') {
      if (c.severity !== activeFilter.toLowerCase()) return false
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return c.summary.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.location.toLowerCase().includes(q)
    }
    return true
  })

  const handleResolve = async (complaintId) => {
    setActiveComplaintId(complaintId)
    try {
      await submitCheckpoint({ complaint_id: complaintId, officer_id: officerId, stage: 'resolved', raw_notes: 'Issue resolved by officer' })
    } catch {}
    const resolved = complaints.find(c => c.id === complaintId)
    if (resolved) setResolvedComplaints(prev => [{ ...resolved, resolvedAt: new Date().toISOString() }, ...prev])
    setComplaints(prev => prev.filter(c => c.id !== complaintId))
    addToast(`${complaintId} resolved. Citizen notified for confirmation.`, 'success')
    setActiveComplaintId(null)
  }

  const handleReassign = async () => {
    const { complaint, selectedOfficer } = reassignModal
    if (!complaint || !selectedOfficer) return
    try {
      await reassignComplaint(complaint.id, { new_officer_id: selectedOfficer.id, reason: 'Manual reassignment by officer' })
    } catch {}
    setComplaints(prev => prev.filter(c => c.id !== complaint.id))
    addToast(`${complaint.id} reassigned to ${selectedOfficer.name}`, 'success')
    setReassignModal({ open: false, complaint: null, selectedOfficer: null })
  }

  const handleOverride = async (data) => {
    try {
      await correctComplaint(data.complaintId, {
        officer_id: officerId,
        original_category: data.originalCategory,
        corrected_category: data.newCategory,
        corrected_department: data.department,
        reason: data.reason,
      })
      addToast(`Classification corrected for ${data.complaintId}. Model updated.`, 'success')
    } catch {
      addToast(`Correction saved for ${data.complaintId} (demo)`, 'success')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('aura_token')
    localStorage.removeItem('aura_role')
    navigate('/')
  }

  const badges = {
    openCount: complaints.length,
    clusterCount: MOCK_CLUSTERS.length,
    resolvedCount: resolvedComplaints.length,
  }

  const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  // ── Views ──

  function QueueView() {
    return (
      <>
        <AnimatePresence>
          {!clusterDismissed && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              style={{ overflow: 'hidden', marginBottom: 16 }}
            >
              <div style={{ background: 'rgba(234,88,12,0.06)', border: '1px solid rgba(234,88,12,0.2)', borderLeft: '4px solid #EA580C', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#EA580C', marginBottom: 4 }}>⚠ SYSTEMIC ALERT: Ward 14</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>18 sanitation complaints in 36 hours — drainage infrastructure failure detected</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: 2 }}>AI diagnosis: cracked sewer mains on MG Road stretch</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                  <button onClick={() => setActiveView('clusters')} style={{ padding: '8px 16px', borderRadius: 8, background: '#EA580C', color: 'white', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>View clusters</button>
                  <button onClick={() => { setClusterDismissed(true); addToast("Reminded in 30 minutes", 'info') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(234,88,12,0.6)', padding: 4 }}>
                    <X size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
              border: activeFilter === f ? 'none' : '1px solid var(--border)',
              background: activeFilter === f ? '#5B4CF5' : 'white',
              color: activeFilter === f ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}>{f}</button>
          ))}
          <div style={{ marginLeft: 'auto', position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search complaints..."
              style={{ height: 36, padding: '0 14px 0 34px', width: 220, border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'white', outline: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}
              onFocus={e => { e.target.style.borderColor = '#5B4CF5'; e.target.style.boxShadow = '0 0 0 3px rgba(91,76,245,0.08)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>Loading assignments…</div>
        ) : filteredComplaints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>All caught up</div>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No complaints in your zone right now</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredComplaints.map((c, i) => (
              <ComplaintCard
                key={c.id}
                complaint={c}
                index={i}
                onResolve={handleResolve}
                onReassign={(id) => setReassignModal({ open: true, complaint: complaints.find(x => x.id === id) || null, selectedOfficer: null })}
                onOverride={(complaint) => setOverrideComplaint(complaint)}
              />
            ))}
          </div>
        )}
      </>
    )
  }

  function ClustersView() {
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Systemic Clusters</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>AI-detected geographic complaint clusters requiring escalation</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {MOCK_CLUSTERS.map(cluster => (
            <div key={cluster.id} style={{
              background: 'white', borderRadius: 14, border: '1px solid #E5E7EB',
              borderLeft: `4px solid ${SEV_COLORS[cluster.severity] || '#6B7280'}`,
              padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#9CA3AF' }}>{cluster.id}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: `${SEV_COLORS[cluster.severity]}18`, color: SEV_COLORS[cluster.severity] || '#6B7280' }}>{cluster.severity.toUpperCase()}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#5B4CF5', background: 'rgba(91,76,245,0.08)', padding: '2px 8px', borderRadius: 20 }}>{cluster.count} complaints</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{cluster.area} · {cluster.type}</div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, color: '#374151' }}>AI Diagnosis: </span>{cluster.aiDiagnosis}
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>Last activity: {cluster.lastActivity} · Councillor: {cluster.councillor}</div>
                </div>
                <button
                  onClick={() => addToast(`Alert sent to ${cluster.councillor} for ${cluster.id}`, 'success')}
                  style={{ padding: '10px 18px', borderRadius: 10, background: '#5B4CF5', color: 'white', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
                >Alert Councillor</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function ResolvedView() {
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Resolved Complaints</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Complaints resolved in this session · {resolvedComplaints.length} total</p>
        </div>
        {resolvedComplaints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <CheckCircle size={40} style={{ color: '#D1D5DB', margin: '0 auto 16px', display: 'block' }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No resolutions yet</div>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Resolved complaints will appear here</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {resolvedComplaints.map((c) => (
              <div key={c.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', borderLeft: '4px solid #16A34A', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <CheckCircle size={18} style={{ color: '#16A34A', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{c.id} — {c.category}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{c.summary}</div>
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-mono)' }}>
                  {new Date(c.resolvedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  function AnalyticsView() {
    const stats = [
      { label: 'Resolved This Week', value: resolvedComplaints.length + 47, icon: CheckCircle, color: '#16A34A', bg: '#F0FDF4' },
      { label: 'Avg Resolution Time', value: '4.2h', icon: Clock, color: '#5B4CF5', bg: '#EEF0FF' },
      { label: 'AI Overrides Filed', value: 3, icon: AlertTriangle, color: '#D97706', bg: '#FFFBEB' },
      { label: 'Model Accuracy', value: '94.2%', icon: TrendingUp, color: '#0891B2', bg: '#E0F2FE' },
    ]
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>My Analytics</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Personal performance metrics for this week</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {stats.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} style={{ color: s.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#111827', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{s.label}</div>
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', padding: '24px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 20 }}>Weekly Resolution Trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ANALYTICS_WEEKLY} barSize={18} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 12 }} />
              <Bar dataKey="resolved" fill="#5B4CF5" radius={[4, 4, 0, 0]} name="Resolved" />
              <Bar dataKey="escalated" fill="#EA580C" radius={[4, 4, 0, 0]} name="Escalated" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  function SettingsView() {
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Settings</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Officer account preferences</p>
        </div>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', padding: '24px', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 16 }}>Profile</div>
          {[
            { label: 'Name', value: officerName },
            { label: 'Zone', value: 'Madhapur · Ward 14' },
            { label: 'Department', value: 'GHMC Sanitation' },
            { label: 'Officer ID', value: officerId, mono: true },
          ].map((row, i, arr) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
              <span style={{ fontSize: 13, color: '#6B7280' }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#111827', fontFamily: row.mono ? 'var(--font-mono)' : 'inherit' }}>{row.value}</span>
            </div>
          ))}
        </div>
        <button onClick={handleLogout} style={{ width: '100%', padding: '13px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Sign Out
        </button>
      </div>
    )
  }

  const views = {
    queue: <QueueView />,
    clusters: <ClustersView />,
    resolved: <ResolvedView />,
    analytics: <AnalyticsView />,
    settings: <SettingsView />,
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: 260, minHeight: '100vh', background: '#0F0F1A',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
      }}>
        <div style={{ padding: '28px 24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#5B4CF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: 16, fontFamily: 'var(--font-mono)' }}>A</span>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'white', letterSpacing: '-0.01em' }}>AURA</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>OFFICER PORTAL</div>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #5B4CF5, #7C6FF7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>{officerName[0]}</span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{officerName}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>GHMC Sanitation</div>
                <div style={{ fontSize: 10, color: '#5B4CF5', fontFamily: 'var(--font-mono)', marginTop: 2 }}>Madhapur · Ward 14</div>
              </div>
            </div>
          </div>
        </div>

        <nav style={{ padding: '4px 12px', flex: 1 }}>
          {NAV_VIEWS.map((item) => {
            const isActive = activeView === item.view
            const badgeVal = item.badgeKey ? badges[item.badgeKey] : null
            const Icon = item.icon
            return (
              <button
                key={item.view}
                onClick={() => setActiveView(item.view)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: isActive ? 'rgba(91,76,245,0.15)' : 'transparent',
                  marginBottom: 2, transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon size={16} style={{ color: isActive ? '#5B4CF5' : 'rgba(255,255,255,0.4)' }} />
                  <span style={{ fontSize: 14, fontWeight: isActive ? 600 : 400, color: isActive ? 'white' : 'rgba(255,255,255,0.5)' }}>{item.label}</span>
                </div>
                {badgeVal > 0 && (
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    background: item.label === 'Clusters' ? 'rgba(239,68,68,0.2)' : 'rgba(91,76,245,0.2)',
                    color: item.label === 'Clusters' ? '#EF4444' : '#5B4CF5',
                    padding: '2px 7px', borderRadius: 20, fontFamily: 'var(--font-mono)',
                  }}>{badgeVal}</span>
                )}
              </button>
            )
          })}
        </nav>

        <div style={{ padding: '16px 24px 28px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: 'rgba(22,163,74,0.7)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginBottom: 4 }}>AI ACCURACY</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#16A34A', fontFamily: 'var(--font-mono)' }}>94.2%</span>
              <span style={{ fontSize: 11, color: 'rgba(22,163,74,0.6)' }}>↑ this week</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: 13, transition: 'all 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
          >→ Logout</button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ marginLeft: 260, flex: 1, minHeight: '100vh', background: 'var(--bg-page, #FAFAF8)' }}>
        <div style={{
          position: 'sticky', top: 0, zIndex: 40,
          background: 'rgba(250,249,246,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)', padding: '0 32px', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{getGreeting()}, {officerName.split(' ')[0]}</span>
            <span style={{ fontSize: 13, color: 'var(--text-tertiary)', marginLeft: 8 }}>{date}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {[
              { label: `${badges.openCount} open`, color: '#5B4CF5', bg: 'rgba(91,76,245,0.08)' },
              { label: `${complaints.filter(c => c.severity === 'critical').length} critical`, color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
              { label: '2 near SLA', color: '#EA580C', bg: 'rgba(234,88,12,0.08)' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: s.bg }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '28px 32px' }}>
          {views[activeView]}
        </div>
      </div>

      <OverrideModal
        isOpen={!!overrideComplaint}
        onClose={() => setOverrideComplaint(null)}
        complaint={overrideComplaint}
        onOverride={handleOverride}
      />

      {/* ── Reassign Modal ── */}
      <AnimatePresence>
        {reassignModal.open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setReassignModal({ open: false, complaint: null, selectedOfficer: null })}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 60 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                zIndex: 61, background: 'white', borderRadius: 20, width: 440, maxWidth: '90vw',
                boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden',
              }}
            >
              <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>Reassign Complaint</div>
                  <button onClick={() => setReassignModal({ open: false, complaint: null, selectedOfficer: null })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
                    <X size={18} />
                  </button>
                </div>
                {reassignModal.complaint && (
                  <div style={{ fontSize: 13, color: '#6B7280', background: '#F9FAFB', borderRadius: 10, padding: '10px 14px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#5B4CF5', marginRight: 8 }}>{reassignModal.complaint.id}</span>
                    {reassignModal.complaint.summary?.slice(0, 60)}…
                  </div>
                )}
              </div>
              <div style={{ padding: '20px 28px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Select Officer</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {MOCK_OFFICERS.map(officer => {
                    const selected = reassignModal.selectedOfficer?.id === officer.id
                    const loadColor = officer.load <= 3 ? '#16A34A' : officer.load <= 5 ? '#D97706' : '#DC2626'
                    return (
                      <button key={officer.id} onClick={() => setReassignModal(m => ({ ...m, selectedOfficer: officer }))} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                        background: selected ? '#EEF0FF' : '#F9FAFB',
                        border: `1px solid ${selected ? '#5B4CF5' : '#E5E7EB'}`,
                        transition: 'all 0.15s ease',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: selected ? '#5B4CF5' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: selected ? 'white' : '#6B7280' }}>{officer.name[0]}</span>
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{officer.name}</div>
                            <div style={{ fontSize: 12, color: '#6B7280' }}>{officer.zone}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: loadColor }}>{officer.load} active</div>
                          <div style={{ fontSize: 11, color: '#9CA3AF' }}>complaints</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div style={{ padding: '16px 28px 28px', display: 'flex', gap: 10 }}>
                <button onClick={() => setReassignModal({ open: false, complaint: null, selectedOfficer: null })} style={{ flex: 1, padding: '12px', borderRadius: 10, background: '#F3F4F6', border: '1px solid #E5E7EB', color: '#6B7280', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleReassign} disabled={!reassignModal.selectedOfficer} style={{
                  flex: 2, padding: '12px', borderRadius: 10, border: 'none',
                  background: reassignModal.selectedOfficer ? '#5B4CF5' : '#E5E7EB',
                  color: reassignModal.selectedOfficer ? 'white' : '#9CA3AF',
                  fontSize: 14, fontWeight: 600, cursor: reassignModal.selectedOfficer ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                }}>
                  Reassign Complaint
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
