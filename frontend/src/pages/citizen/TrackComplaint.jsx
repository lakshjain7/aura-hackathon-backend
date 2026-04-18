import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Circle, Loader, MapPin, Shield, AlertTriangle, Clock, ArrowLeft, Users } from 'lucide-react'
import AgentVisualiser from '../../components/agent/AgentVisualiser'
import { useMockSSEStream } from '../../hooks/useSSEStream'
import SeverityBadge from '../../components/shared/SeverityBadge'
import SLACountdown from '../../components/shared/SLACountdown'
import { createComplaintStream, getComplaint, getLiveGPS } from '../../utils/api'
import { addPoints, IMPACT_POINTS } from '../../utils/points'

const WHATSAPP_GROUPS = [
  { name: 'Madhapur Ward 14 Residents', members: 342, topic: 'Sanitation & Roads' },
  { name: 'HITEC City Civic Action', members: 567, topic: 'All Issues' },
]

export default function TrackComplaint() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { nodeStates: mockNodeStates, events: mockEvents, runPipeline } = useMockSSEStream()

  const [nodeStates, setNodeStates] = useState({})
  const [events, setEvents] = useState([])
  const [complaint, setComplaint] = useState(null)
  const [officerLocation, setOfficerLocation] = useState(null)
  const [securityBlocked, setSecurityBlocked] = useState(false)
  const [clusterAlert, setClusterAlert] = useState(null)
  const [showResolution, setShowResolution] = useState(false)
  const [resolved, setResolved] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const complaintId = id || 'GR-2026-0847'
  const slaDeadline = complaint?.sla_deadline || new Date(Date.now() + 23 * 3600000 + 14 * 60000).toISOString()

  useEffect(() => {
    if (!complaintId) return
    let usedMock = false
    let stream
    try {
      stream = createComplaintStream(complaintId)
      const timeout = setTimeout(() => {
        if (!usedMock && Object.keys(nodeStates).length === 0) { usedMock = true; runPipeline('normal') }
      }, 3000)
      stream.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          clearTimeout(timeout)
          if (data.type === 'node_transition') setNodeStates(prev => ({ ...prev, [data.node]: { status: data.status, summary: data.summary } }))
          if (data.type === 'security_block') setSecurityBlocked(true)
          if (data.type === 'cluster_detected') setClusterAlert(data)
          if (data.type === 'resolution_confirmed') setResolved(true)
          setEvents(prev => [data, ...prev].slice(0, 50))
        } catch {}
      }
      stream.onerror = () => { stream.close(); if (!usedMock) { usedMock = true; runPipeline('normal') } }
      return () => { clearTimeout(timeout); stream?.close() }
    } catch { runPipeline('normal') }
  }, [complaintId])

  const displayNodeStates = Object.keys(nodeStates).length > 0 ? nodeStates : mockNodeStates
  const displayEvents = events.length > 0 ? events : mockEvents

  useEffect(() => {
    if (!complaintId) return
    getComplaint(complaintId).then(res => setComplaint(res.data)).catch(() => {})
  }, [complaintId])

  useEffect(() => {
    if (!complaint?.officer_id) return
    const interval = setInterval(async () => {
      try {
        const res = await getLiveGPS(complaintId)
        if (res.data.active) setOfficerLocation({ lat: res.data.lat, lng: res.data.lng })
      } catch {}
    }, 5000)
    return () => clearInterval(interval)
  }, [complaintId, complaint?.officer_id])

  const handleResolve = (yes) => {
    setResolved(yes)
    setShowResolution(false)
    if (yes) {
      addPoints(IMPACT_POINTS.CONFIRM_RESOLUTION, 'Resolution confirmed')
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    } else {
      addPoints(IMPACT_POINTS.REJECT_FALSE_RESOLUTION, 'Rejected false resolution')
    }
  }

  const timelineSteps = [
    { key: 'filed', label: 'Filed', detail: 'Received via Web · Timestamp locked', done: true, color: '#16A34A' },
    { key: 'classified', label: 'AI Classified', detail: `${complaint?.category || 'Sanitation'} · ${complaint?.severity?.toUpperCase() || 'HIGH'} · ${complaint?.confidence || 94}% confidence`, done: true, color: '#16A34A' },
    { key: 'routed', label: 'Routed', detail: `Assigned to ${complaint?.department || 'GHMC Sanitation'}, Madhapur Zone`, done: true, color: '#16A34A' },
    { key: 'review', label: 'Under Review', detail: 'Officer assigned · Expected resolution in 48 hours', active: complaint?.status !== 'resolved', color: '#5B4CF5' },
    { key: 'resolved', label: 'Resolved', detail: 'Awaiting officer confirmation', done: complaint?.status === 'resolved', color: '#9CA3AF' },
  ]

  const severityColor = { critical: '#DC2626', high: '#EA580C', medium: '#CA8A04', low: '#16A34A' }
  const sev = complaint?.severity || 'high'

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'var(--font-sans)' }}>

      {/* Confetti */}
      {showConfetti && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, pointerEvents: 'none', overflow: 'hidden' }}>
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div key={i}
              initial={{ y: -20, x: `${Math.random() * 100}vw`, opacity: 1, scale: 1 }}
              animate={{ y: '110vh', opacity: 0, rotate: Math.random() * 720 }}
              transition={{ duration: 2 + Math.random() * 1.5, delay: Math.random() * 0.4, ease: 'easeIn' }}
              style={{ position: 'absolute', width: 8, height: 8, borderRadius: Math.random() > 0.5 ? '50%' : 2, background: ['#5B4CF5', '#16A34A', '#D97706', '#0891B2'][i % 4] }}
            />
          ))}
        </div>
      )}

      {/* Hero Banner */}
      <div style={{ height: 180, position: 'relative', overflow: 'hidden' }}>
        <img src="/images/govtindia.jpeg" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} alt="" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(91,76,245,0.92) 0%, rgba(124,111,247,0.85) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>AURA Grievance System · भारत सरकार</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'white', letterSpacing: '-0.01em' }}>Track Your Complaint</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', padding: '4px 14px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>LIVE TRACKING ACTIVE</span>
          </div>
        </div>
        {/* Back button */}
        <button onClick={() => navigate('/')} style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6, color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
          <ArrowLeft size={14} /> AURA
        </button>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px 100px' }}>

        {/* Complaint ID card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{ background: 'white', borderRadius: '0 0 20px 20px', border: '1px solid #E2E8F0', borderTop: 'none', padding: '24px 28px', marginBottom: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginBottom: 6 }}>TRACKING ID</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#5B4CF5', fontFamily: 'var(--font-mono)', letterSpacing: '-0.01em', marginBottom: 8 }}>{complaintId}</div>
              <div style={{ fontSize: 14, color: '#374151', fontWeight: 500, lineHeight: 1.5 }}>
                {complaint?.raw_text || complaint?.summary || 'Garbage not collected in Ward 14, Madhapur for 5 days'}
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <SeverityBadge severity={sev} />
            </div>
          </div>

          {/* Security strip */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={13} style={{ color: '#5B4CF5' }} />
            <span style={{ fontSize: 11, color: '#6B7280' }}>Complaint data is encrypted · Audit trail immutable · CPGRAMS compatible</span>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: '#9CA3AF' }}>CP-2026-08471</span>
          </div>
        </motion.div>

        {/* Timeline card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}
          style={{ background: 'white', borderRadius: 20, border: '1px solid #E2E8F0', padding: '24px 28px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={14} style={{ color: '#5B4CF5' }} /> Complaint Progress
          </div>
          {timelineSteps.map((step, i) => (
            <div key={step.key} style={{ display: 'flex', gap: 16, paddingBottom: i < timelineSteps.length - 1 ? 20 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {step.done ? (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#F0FDF4', border: '2px solid #16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckCircle size={15} style={{ color: '#16A34A' }} />
                  </div>
                ) : step.active ? (
                  <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: '#EEF0FF', border: '2px solid #5B4CF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Loader size={14} style={{ color: '#5B4CF5' }} />
                  </motion.div>
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#F9FAFB', border: '2px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Circle size={12} style={{ color: '#D1D5DB' }} />
                  </div>
                )}
                {i < timelineSteps.length - 1 && (
                  <div style={{ width: 2, flex: 1, minHeight: 20, marginTop: 4, background: step.done ? '#BBF7D0' : '#E5E7EB', borderRadius: 2 }} />
                )}
              </div>
              <div style={{ paddingBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: step.done || step.active ? 600 : 400, color: step.done ? '#111827' : step.active ? '#5B4CF5' : '#9CA3AF', marginBottom: 3 }}>
                  {step.label}
                </div>
                {step.detail && (
                  <div style={{ fontSize: 12, color: step.done ? '#6B7280' : step.active ? '#7C6FF7' : '#D1D5DB', lineHeight: 1.5 }}>{step.detail}</div>
                )}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Officer en-route indicator */}
        <AnimatePresence>
          {officerLocation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderLeft: '4px solid #2563EB', borderRadius: 14, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                style={{ width: 10, height: 10, borderRadius: '50%', background: '#2563EB', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8', marginBottom: 2 }}>Officer is en route</div>
                <div style={{ fontSize: 12, color: '#3B82F6', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Shield size={11} /> Location tracking active · coordinates protected
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Department assignment card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.16 }}
          style={{ background: 'white', borderRadius: 20, border: '1px solid #E2E8F0', borderLeft: `4px solid ${severityColor[sev] || '#EA580C'}`, padding: '20px 24px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, gap: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                {complaint?.department || 'GHMC Sanitation Division'}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>Madhapur Zone · Ward 14</div>
            </div>
            <SeverityBadge severity={sev} size="sm" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F9FAFB', borderRadius: 10 }}>
              <span style={{ fontSize: 12, color: '#6B7280' }}>Assigned Officer</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{complaint?.officer_name || 'Rajesh K.'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F9FAFB', borderRadius: 10 }}>
              <span style={{ fontSize: 12, color: '#6B7280' }}>SLA Remaining</span>
              <SLACountdown deadlineTimestamp={slaDeadline} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F9FAFB', borderRadius: 10 }}>
              <span style={{ fontSize: 12, color: '#6B7280' }}>AI Confidence</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A', fontFamily: 'var(--font-mono)' }}>{complaint?.confidence || 94}%</span>
            </div>
          </div>
        </motion.div>

        {/* Agent Visualiser */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.22 }}
          style={{ background: 'white', borderRadius: 20, border: '1px solid #E2E8F0', padding: '20px 24px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 16 }}>What AURA is doing right now</div>
          <AgentVisualiser
            nodeStates={displayNodeStates}
            events={displayEvents}
            compact
            translationInfo={{
              fromLang: complaint?.language || 'hi',
              fromScript: 'हिंदी',
              fromText: complaint?.raw_text || 'हमारे वार्ड 14 में 5 दिनों से कूड़ा नहीं उठाया गया है',
              toText: complaint?.anonymised_text || 'Garbage not collected in Ward 14 for 5 days',
            }}
          />
        </motion.div>

        {/* Cluster Alert */}
        <AnimatePresence>
          {(clusterAlert || (displayNodeStates.auditor?.status === 'complete' && displayNodeStates.auditor?.summary?.includes('CLUSTER'))) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300 }}
              style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderLeft: '4px solid #D97706', borderRadius: 16, padding: '18px 22px', marginBottom: 16 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <AlertTriangle size={16} style={{ color: '#D97706' }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: '#D97706' }}>Systemic Pattern Detected</div>
              </div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                {clusterAlert?.message || 'Your complaint is part of a cluster — 18 similar reports in Ward 14. AURA has auto-flagged this as a systemic infrastructure failure and alerted the Ward Councillor.'}
              </div>
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={12} style={{ color: '#9CA3AF' }} />
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>18 citizens affected · Councillor Smt. Lakshmi Devi notified</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* WhatsApp groups */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
          style={{ background: 'white', borderRadius: 20, border: '1px solid #E2E8F0', padding: '20px 24px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Stay Updated via WhatsApp</div>
          {[
            { name: 'Madhapur Ward 14 Residents', desc: 'Sanitation & Roads · 342 members', link: 'https://chat.whatsapp.com/I0vSfFlj2luDBPLMbcvEe3' },
            { name: 'HITEC City Civic Action', desc: 'All Issues · 567 members', link: 'https://chat.whatsapp.com/EpT93gyXWYB0vBSEQRV8vr' },
            { name: 'Sanitation Watch Group', desc: 'Immediate Alerts · 128 members', link: 'https://chat.whatsapp.com/Jy5KyRO3igjEL7W54UUjVT' }
          ].map((group, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#F9FAFB', borderRadius: 12, border: '1px solid #E5E7EB', marginBottom: i < 2 ? 8 : 0 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{group.name}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{group.desc}</div>
              </div>
              <motion.a
                href={group.link}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '8px 16px', background: '#ECFDF5', color: '#059669',
                  borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none'
                }}
              >
                Join
              </motion.a>
            </div>
          ))}
        </motion.div>

        {/* Demo trigger */}
        <button
          onClick={() => setShowResolution(true)}
          style={{ width: '100%', padding: '12px', borderRadius: 12, background: '#F9FAFB', border: '1px dashed #D1D5DB', color: '#9CA3AF', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
        >
          Demo: Trigger resolution confirmation
        </button>
      </div>

      {/* Resolution bottom sheet */}
      <AnimatePresence>
        {showResolution && !resolved && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowResolution(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 41, background: 'white', borderRadius: '24px 24px 0 0', padding: '32px 24px 40px', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}
            >
              <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E5E7EB', margin: '0 auto 24px' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={20} style={{ color: '#16A34A' }} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Issue Marked Resolved</div>
              </div>
              <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 8, lineHeight: 1.6 }}>
                GHMC Sanitation has marked your complaint as resolved. Please confirm if the issue has actually been fixed at your location.
              </p>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 24 }}>If you say NO, this auto-escalates to the Ward Commissioner.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={() => handleResolve(true)} style={{ width: '100%', padding: '15px', borderRadius: 12, background: '#16A34A', color: 'white', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                  ✓ Yes, issue is fixed
                </button>
                <button onClick={() => handleResolve(false)} style={{ width: '100%', padding: '15px', borderRadius: 12, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                  ✕ No, problem still exists
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {resolved === true && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ position: 'fixed', bottom: 24, left: 16, right: 16, zIndex: 40, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 16, padding: '20px 24px', textAlign: 'center', boxShadow: '0 8px 32px rgba(22,163,74,0.2)' }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: '#16A34A', marginBottom: 4 }}>Thank you! Resolution confirmed.</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#15803D', fontFamily: 'var(--font-mono)' }}>4.2 hrs</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>+{IMPACT_POINTS.CONFIRM_RESOLUTION} impact points earned · AURA learns from every case</div>
          </motion.div>
        )}
        {resolved === false && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ position: 'fixed', bottom: 24, left: 16, right: 16, zIndex: 40, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 16, padding: '20px 24px', textAlign: 'center', boxShadow: '0 8px 32px rgba(220,38,38,0.15)' }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: '#DC2626', marginBottom: 4 }}>Complaint escalated to Ward Commissioner</div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>+{IMPACT_POINTS.REJECT_FALSE_RESOLUTION} points for holding the system accountable</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
