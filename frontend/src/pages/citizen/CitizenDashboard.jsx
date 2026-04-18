import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Camera, FileText, Search, Trophy, Users, Star, ChevronRight, MapPin } from 'lucide-react'
import StatusBadge from '../../components/shared/StatusBadge'
import { getMyComplaints } from '../../utils/api'
import { getImpactPoints, getPointsLog } from '../../utils/points'
import { useToast } from '../../components/ui/Toast'

const MOCK_COMPLAINTS = [
  { id: 'GR-2026-0847', category: 'Sanitation', summary: 'Garbage not collected for 5 days near MG Road', location: 'Ward 14, Madhapur', status: 'in_progress', submittedAt: new Date(Date.now() - 6 * 3600000).toISOString(), progress: 60 },
  { id: 'GR-2026-0831', category: 'Road & Infrastructure', summary: 'Pothole near school gate causing hazard', location: 'Ward 12, Gachibowli', status: 'resolved', submittedAt: new Date(Date.now() - 2 * 86400000).toISOString(), progress: 100 },
  { id: 'GR-2026-0819', category: 'Water Supply', summary: 'No water supply since 3 days', location: 'Ward 14, Madhapur', status: 'escalated', submittedAt: new Date(Date.now() - 5 * 86400000).toISOString(), progress: 40 },
]

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Smt. Lakshmi R.', points: 1240, complaints: 12, ward: 'Ward 14' },
  { rank: 2, name: 'Sri. Venkat M.', points: 980, complaints: 9, ward: 'Ward 12' },
  { rank: 3, name: 'Priya S.', points: 840, complaints: 8, ward: 'Ward 10' },
  { rank: 4, name: 'You', points: 0, complaints: 0, ward: 'Ward 14', isYou: true },
]

const LIVE_EVENTS = [
  { type: 'join', user: 'Abhishek', group: 'Ward 14 Residents', time: '2m ago' },
  { type: 'officer', msg: 'Officer Rajesh accepted Ticket #847', time: '12m ago' },
  { type: 'cluster', msg: 'Systemic Issue detected in Ward 14', time: '30m ago' },
]

const PROGRESS_STAGES = ['Submitted', 'Classified', 'Assigned', 'In Progress', 'Resolved']

function getStageIndex(status) {
  const map = { pending: 1, processing: 2, in_progress: 3, fix_applied: 4, resolved: 5 }
  return map[status] || 1
}

export default function CitizenDashboard() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [complaints, setComplaints] = useState(MOCK_COMPLAINTS)
  const [communities, setCommunities] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [points, setPoints] = useState(0)
  const [pointsLog, setPointsLog] = useState([])
  const [loading, setLoading] = useState(false)

  const name = localStorage.getItem('aura_name') || 'Citizen'
  const phone = localStorage.getItem('aura_phone') || ''

  const [feedItems, setFeedItems] = useState([])
  const [activeWard, setActiveWard] = useState('WARD 14')
  
  useEffect(() => {
    setPoints(getImpactPoints())
    setPointsLog(getPointsLog())
    
    const fetchData = async () => {
      try {
        const resComms = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/communities`)
        const commData = await resComms.json()
        setCommunities(commData)
        
        // Fetch activity logs (virtual group chat)
        const resActivity = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/activity`)
        const activityData = await resActivity.json()
        
        const combinedFeed = [
          ...activityData.map(a => ({ type: 'activity', user: a.user_name, msg: a.message, time: 'Just now' })),
          ...feedData.map(f => ({ type: 'complaint', user: f.user_id?.slice(-4) || 'Citizen', msg: `${f.category}: ${f.summary}`, time: 'Recently' }))
        ]
        setFeedItems(combinedFeed.slice(0, 8))
        
        setLoading(true)
        const resComp = await getMyComplaints(phone)
        const data = resComp.data.complaints || resComp.data
        if (Array.isArray(data) && data.length > 0) setComplaints(data)
        setLoading(false)
      } catch (e) {
        setLoading(false)
      }
    }
    fetchData()
  }, [phone])

  const handleJoinGroup = async (group) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/communities/${group.id}/join?phone=${phone}`, { method: 'POST' })
      // Refresh counts
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/communities`)
      setCommunities(await res.json())
    } catch (e) {}
  }

  const leaderboard = MOCK_LEADERBOARD.map(l => l.isYou ? { ...l, points, complaints: complaints.length } : l)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'var(--font-sans)' }}>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px 80px' }}>

        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{ background: 'linear-gradient(135deg, #5B4CF5, #7C6FF7)', borderRadius: 20, padding: '28px', marginBottom: 20, color: 'white', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'absolute', bottom: -20, right: 20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>
                {name[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: '0.06em', marginBottom: 2 }}>{greeting()}</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{name}</div>
                <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={11} /> Ward 14, Madhapur
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: '0.06em' }}>IMPACT POINTS</div>
              <div style={{ fontSize: 36, fontWeight: 800, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{points}</div>
              <div style={{ fontSize: 11, opacity: 0.65, marginTop: 2 }}>Rank #{leaderboard.findIndex(l => l.isYou) + 1} in ward</div>
            </div>
          </div>
          {pointsLog.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', gap: 12 }}>
              {pointsLog.slice(0, 2).map((e, i) => (
                <div key={i} style={{ fontSize: 12, opacity: 0.8 }}>
                  +{e.amount} pts — {e.reason}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}
        >
          {[
            { icon: FileText, label: 'File Complaint', color: '#5B4CF5', bg: '#EEF0FF', onClick: () => navigate('/submit') },
            { icon: Camera, label: 'Photo Report', color: '#0891B2', bg: '#E0F2FE', onClick: () => navigate('/submit?mode=photo') },
            { icon: Search, label: 'Track Issue', color: '#D97706', bg: '#FFFBEB', onClick: () => navigate('/submit') },
          ].map((a, i) => {
            const Icon = a.icon
            return (
              <motion.button
                key={i}
                onClick={a.onClick}
                whileHover={{ y: -2, boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}
                whileTap={{ scale: 0.97 }}
                style={{ background: 'white', borderRadius: 14, border: '1px solid #E2E8F0', padding: '20px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} style={{ color: a.color }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', textAlign: 'center' }}>{a.label}</span>
              </motion.button>
            )
          })}
        </motion.div>

        {/* My complaints */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.14 }}
          style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', marginBottom: 20, overflow: 'hidden' }}
        >
          <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>My Complaints</div>
            <span style={{ fontSize: 12, color: '#5B4CF5', fontWeight: 600 }}>{complaints.length} total</span>
          </div>
          <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {complaints.map((c, i) => (
              <div key={c.id} style={{ padding: '16px', background: '#F9FAFB', borderRadius: 12, border: '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#9CA3AF' }}>{c.id}</span>
                      <StatusBadge status={c.status} size="sm" />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 3 }}>{c.summary}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={10} /> {c.location}
                    </div>
                  </div>
                  <button onClick={() => navigate(`/track/${c.id}`)} style={{ padding: '6px 12px', borderRadius: 8, background: '#EEF0FF', color: '#5B4CF5', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                    Track
                  </button>
                </div>
                {/* Progress bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 4, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${c.progress}%`, background: c.status === 'resolved' ? '#16A34A' : c.status === 'escalated' ? '#DC2626' : '#5B4CF5', borderRadius: 2, transition: 'width 0.5s ease' }} />
                  </div>
                  <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{c.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.20 }}
          style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', marginBottom: 20, overflow: 'hidden' }}
        >
          <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Trophy size={16} style={{ color: '#D97706' }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Ward 14 Leaderboard</div>
          </div>
          <div style={{ paddingBottom: 8 }}>
            {leaderboard.map((l, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', padding: '12px 20px',
                background: l.isYou ? '#EEF0FF' : 'transparent',
                borderBottom: i < leaderboard.length - 1 ? '1px solid #F3F4F6' : 'none',
              }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: l.rank === 1 ? '#FEF3C7' : l.rank === 2 ? '#F3F4F6' : l.rank === 3 ? '#FEF3C7' : '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 12 }}>
                  {l.rank <= 3 ? <Star size={13} style={{ color: l.rank === 1 ? '#D97706' : '#9CA3AF' }} /> : <span style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF' }}>{l.rank}</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: l.isYou ? 700 : 500, color: l.isYou ? '#5B4CF5' : '#111827' }}>{l.name}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{l.complaints} complaints · {l.ward}</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: l.isYou ? '#5B4CF5' : '#111827', fontFamily: 'var(--font-mono)' }}>{l.points}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Live Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.24 }}
          style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: 20 }}
        >
          <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 8px #EF4444' }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>AURA Neighborhood Feed</div>
            </div>
            <select 
              onChange={(e) => {
                const ward = e.target.value;
                setActiveWard(ward);
                addToast(`Filtering for ${ward}`, 'info');
              }}
              style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', outline: 'none' }}
            >
              <option>WARD 14 ACTIVE</option>
              <option>ALL WARDS</option>
            </select>
          </div>
          <div style={{ paddingBottom: 8 }}>
            {feedItems.length > 0 ? feedItems.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', padding: '14px 20px', borderBottom: i < feedItems.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 }}>
                  <span style={{ fontSize: 14 }}>📢</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#374151' }}>
                    <b>Citizen ...{e.user}</b> reported: {e.msg}
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{e.time}</div>
                </div>
              </div>
            )) : (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                No recent neighborhood activity
              </div>
            )}
          </div>
        </motion.div>

        {/* WhatsApp communities */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.28 }}
          style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}
        >
          <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Users size={16} style={{ color: '#16A34A' }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Your Communities</div>
          </div>
          <div style={{ paddingBottom: 8 }}>
            {communities.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: i < communities.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 }}>
                  <Users size={16} style={{ color: '#16A34A' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{c.members_count} members</div>
                </div>
                <a 
                  href={c.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={() => handleJoinGroup(c)}
                  style={{ 
                    padding: '6px 14px', borderRadius: 8, background: '#16A34A', color: 'white', 
                    fontSize: 12, fontWeight: 700, textDecoration: 'none' 
                  }}
                >
                  Join
                </a>
              </div>
            ))}
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            style={{
              width: 'calc(100% - 40px)', margin: '8px 20px 20px', padding: '12px',
              borderRadius: 12, border: '2px dashed #E2E8F0', background: 'transparent',
              color: '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
          >
            + Create New Watch Group for your area
          </button>

          {showAddModal && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
            }}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'white', borderRadius: 24, padding: 32, width: '100%', maxWidth: 400 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#111827' }}>New Community Group</h3>
                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>AURA AI will verify and provision this group for your ward.</p>
                
                <input id="dash-group-name" placeholder="Group Name (e.g. Madhapur Sanitation)" style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #E5E7EB', marginBottom: 12 }} />
                <input id="dash-group-link" placeholder="WhatsApp Invite Link" style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #E5E7EB', marginBottom: 20 }} />
                
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #E5E7EB', background: 'white', color: '#374151' }}>Cancel</button>
                  <button onClick={async () => {
                    const name = document.getElementById('dash-group-name').value;
                    const link = document.getElementById('dash-group-link').value;
                    if (!name || !link) return;
                    
                    const btn = document.getElementById('dash-create-btn');
                    btn.innerText = 'Provisioning Agent...';
                    btn.disabled = true;

                    await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/communities`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        name, link, 
                        suburb: 'Madhapur', 
                        topic: 'Community Watch',
                        phone: phone 
                      })
                    });
                    
                    addToast('AURA Agent Provisioned!', 'success');
                    setTimeout(() => window.location.reload(), 1500);
                  }} id="dash-create-btn" style={{ flex: 1, padding: 12, borderRadius: 10, background: '#5B4CF5', color: 'white', border: 'none', cursor: 'pointer' }}>Activate Agent</button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
