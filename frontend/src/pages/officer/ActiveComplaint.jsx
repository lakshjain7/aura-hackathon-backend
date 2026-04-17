import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, ChevronDown, ChevronUp, MapPin, Navigation } from 'lucide-react'
import SeverityBadge from '../../components/shared/SeverityBadge'
import SLACountdown from '../../components/shared/SLACountdown'
import { useToast } from '../../components/ui/Toast'
import { getComplaint, submitCheckpoint, correctComplaint, pingGPS } from '../../utils/api'

const STAGES = ['arrived', 'in_progress', 'fix_applied', 'resolved']
const STAGE_LABELS = { arrived: 'Arrived', in_progress: 'In Progress', fix_applied: 'Fix Applied', resolved: 'Resolved' }

const CATEGORIES = ['Sanitation', 'Water Supply', 'Road & Infrastructure', 'Electricity', 'Drainage', 'Parks & Recreation', 'Public Safety', 'Other']
const DEPARTMENTS = ['GHMC Sanitation', 'HMWSSB', 'Roads & Buildings', 'TSSPDCL', 'Municipal Corporation', 'Other']

const MOCK_COMPLAINT = {
  id: 'GR-2026-0847',
  severity: 'critical',
  category: 'Sanitation',
  summary: 'Garbage not collected for 5 days in Ward 14, causing health hazard near school',
  location: 'Ward 14, Madhapur, Hyderabad - 500081',
  language: 'hi',
  source: 'WhatsApp',
  sla_deadline: new Date(Date.now() + 2 * 3600000).toISOString(),
  raw_text: 'हमारे वार्ड 14 में 5 दिनों से कूड़ा नहीं उठाया गया है',
  anonymised_text: 'Garbage not collected in Ward 14 for 5 days',
  department: 'GHMC Sanitation',
  confidence: 94,
  pincode: '500081',
}

export default function ActiveComplaint() {
  const { complaintId } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [complaint, setComplaint] = useState(null)
  const [currentStage, setCurrentStage] = useState('arrived')
  const [notes, setNotes] = useState('')
  const [proofPhoto, setProofPhoto] = useState(null)
  const [proofPreview, setProofPreview] = useState(null)
  const [submittingCheckpoint, setSubmittingCheckpoint] = useState(false)
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [correctedCategory, setCorrectedCategory] = useState('')
  const [correctedDept, setCorrectedDept] = useState('')
  const [correctionReason, setCorrectionReason] = useState('')
  const [gpsActive, setGpsActive] = useState(false)
  const [resolvingFinal, setResolvingFinal] = useState(false)

  const officerId = localStorage.getItem('aura_officer_id') || 'demo'

  // Fetch complaint
  useEffect(() => {
    getComplaint(complaintId)
      .then(res => setComplaint(res.data))
      .catch(() => setComplaint(MOCK_COMPLAINT))
  }, [complaintId])

  // GPS watch
  useEffect(() => {
    if (!navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsActive(true)
        pingGPS({
          officer_id: officerId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          complaint_id: complaintId,
        }).catch(() => {})
      },
      () => setGpsActive(false),
      { enableHighAccuracy: true, maximumAge: 10000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [complaintId, officerId])

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setProofPhoto(file)
    const reader = new FileReader()
    reader.onload = (ev) => setProofPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleCheckpointSubmit = async () => {
    setSubmittingCheckpoint(true)
    try {
      const fd = new FormData()
      fd.append('complaint_id', complaintId)
      fd.append('officer_id', officerId)
      fd.append('stage', currentStage)
      fd.append('raw_notes', notes)
      if (proofPhoto) fd.append('image', proofPhoto)

      await submitCheckpoint(fd)
      addToast('Checkpoint submitted successfully', 'success')
      setNotes('')
      setProofPhoto(null)
      setProofPreview(null)
    } catch {
      addToast('Checkpoint saved locally (demo mode)', 'success')
      setNotes('')
      setProofPhoto(null)
      setProofPreview(null)
    } finally {
      setSubmittingCheckpoint(false)
    }
  }

  const handleCorrection = async () => {
    if (!correctedCategory) return
    try {
      await correctComplaint(complaintId, {
        officer_id: officerId,
        original_category: complaint?.category || '',
        corrected_category: correctedCategory,
        corrected_department: correctedDept,
        reason: correctionReason,
      })
      addToast('AI correction submitted. Model accuracy updated.', 'success')
      setOverrideOpen(false)
    } catch {
      addToast('Correction saved (demo mode)', 'success')
      setOverrideOpen(false)
    }
  }

  const handleMarkResolved = async () => {
    setResolvingFinal(true)
    try {
      const fd = new FormData()
      fd.append('complaint_id', complaintId)
      fd.append('officer_id', officerId)
      fd.append('stage', 'resolved')
      fd.append('raw_notes', notes || 'Issue fully resolved')
      if (proofPhoto) fd.append('image', proofPhoto)

      await submitCheckpoint(fd)
      addToast('Complaint resolved. Citizen will be notified for confirmation.', 'success')
    } catch {
      addToast('Resolved (demo mode). Citizen notified.', 'success')
    }
    setResolvingFinal(false)
    navigate('/officer')
  }

  const c = complaint || MOCK_COMPLAINT
  const slaUrgent = c.sla_deadline && new Date(c.sla_deadline) - Date.now() < 2 * 3600000

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', fontFamily: 'var(--font-sans)' }}>
      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(250,249,246,0.95)', backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <button
          onClick={() => navigate('/officer')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14 }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-tertiary)' }}>{complaintId}</span>
        <SeverityBadge severity={c.severity} size="sm" />
        <div style={{ marginLeft: 'auto' }}>
          <SLACountdown deadlineTimestamp={c.sla_deadline} />
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 24px 120px' }}>

        {/* Complaint details card */}
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderLeft: `4px solid ${c.severity === 'critical' ? '#DC2626' : c.severity === 'high' ? '#EA580C' : '#D97706'}`, borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-mono)' }}>{c.id}</span>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#F3F4F6', color: '#6B7280', fontWeight: 600 }}>{c.category}</span>
          </div>

          <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 12, lineHeight: 1.45 }}>{c.summary}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <MapPin size={13} style={{ color: '#9CA3AF' }} />
            <span style={{ fontSize: 13, color: '#6B7280' }}>{c.location}</span>
          </div>

          {c.language && c.language !== 'en' && (
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 14px', marginTop: 12 }}>
              <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Original ({c.language})</p>
              <p style={{ fontSize: 13, color: '#374151', fontStyle: 'italic' }}>{c.raw_text}</p>
            </div>
          )}
        </div>

        {/* Stage selector */}
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Current Stage</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {STAGES.map(stage => {
              const active = currentStage === stage
              return (
                <motion.button
                  key={stage}
                  onClick={() => setCurrentStage(stage)}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    padding: '10px 8px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: active ? 'none' : '1px solid #E5E7EB',
                    background: active ? '#5B4CF5' : 'white',
                    color: active ? 'white' : '#6B7280',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {STAGE_LABELS[stage]}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Checkpoint form */}
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
            Submit Checkpoint — <span style={{ color: '#5B4CF5' }}>{STAGE_LABELS[currentStage]}</span>
          </p>

          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add notes about this stage..."
            style={{
              width: '100%', minHeight: 100, padding: 12, boxSizing: 'border-box',
              border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14,
              fontFamily: 'inherit', resize: 'vertical', outline: 'none',
              color: '#111827', lineHeight: 1.5,
            }}
            onFocus={e => { e.target.style.borderColor = '#5B4CF5'; e.target.style.boxShadow = '0 0 0 3px rgba(91,76,245,0.08)' }}
            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }}
          />

          {/* Photo upload */}
          <div style={{ marginTop: 12 }}>
            {proofPreview ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                <img src={proofPreview} alt="proof" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Proof photo attached</p>
                  <button onClick={() => { setProofPhoto(null); setProofPreview(null) }} style={{ fontSize: 12, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                border: '1px dashed #D1D5DB', borderRadius: 8, cursor: 'pointer',
                fontSize: 13, color: '#6B7280', background: '#F9FAFB',
              }}>
                <Camera size={16} />
                Upload proof photo
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
              </label>
            )}
          </div>

          <motion.button
            onClick={handleCheckpointSubmit}
            disabled={submittingCheckpoint || !notes.trim()}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%', height: 44, marginTop: 16,
              background: submittingCheckpoint || !notes.trim() ? '#E5E7EB' : '#5B4CF5',
              color: submittingCheckpoint || !notes.trim() ? '#9CA3AF' : 'white',
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
              cursor: submittingCheckpoint || !notes.trim() ? 'default' : 'pointer',
            }}
          >
            {submittingCheckpoint ? 'Submitting…' : 'Submit Checkpoint'}
          </motion.button>
        </div>

        {/* Override AI — expandable */}
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, marginBottom: 20, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <button
            onClick={() => setOverrideOpen(v => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: '#374151',
            }}
          >
            Override AI Classification
            {overrideOpen ? <ChevronUp size={16} style={{ color: '#9CA3AF' }} /> : <ChevronDown size={16} style={{ color: '#9CA3AF' }} />}
          </button>

          <AnimatePresence>
            {overrideOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden', borderTop: '1px solid #F3F4F6' }}
              >
                <div style={{ padding: '16px 20px 20px' }}>
                  <div style={{ padding: '10px 14px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 8, marginBottom: 16 }}>
                    <p style={{ fontSize: 12, color: '#0369A1' }}>
                      AI classified as: <strong>{c.category}</strong> ({c.confidence || 94}% confidence)
                    </p>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Corrected Category</label>
                    <select
                      value={correctedCategory}
                      onChange={e => setCorrectedCategory(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#111827', background: 'white', outline: 'none' }}
                    >
                      <option value="">Select category...</option>
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Corrected Department</label>
                    <select
                      value={correctedDept}
                      onChange={e => setCorrectedDept(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#111827', background: 'white', outline: 'none' }}
                    >
                      <option value="">Select department...</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Reason for correction</label>
                    <input
                      value={correctionReason}
                      onChange={e => setCorrectionReason(e.target.value)}
                      placeholder="Why is the AI classification wrong?"
                      style={{ width: '100%', padding: '9px 12px', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#111827', outline: 'none' }}
                    />
                  </div>

                  <button
                    onClick={handleCorrection}
                    disabled={!correctedCategory}
                    style={{
                      padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      background: correctedCategory ? '#FFF7ED' : '#F3F4F6',
                      color: correctedCategory ? '#D97706' : '#9CA3AF',
                      border: `1px solid ${correctedCategory ? '#FDE68A' : '#E5E7EB'}`,
                      cursor: correctedCategory ? 'pointer' : 'default',
                    }}
                  >
                    Submit Correction
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* GPS status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '8px 14px', background: gpsActive ? '#F0FDF4' : '#F9FAFB', border: `1px solid ${gpsActive ? '#BBF7D0' : '#E5E7EB'}`, borderRadius: 20, width: 'fit-content' }}>
          <Navigation size={12} style={{ color: gpsActive ? '#16A34A' : '#9CA3AF' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: gpsActive ? '#16A34A' : '#9CA3AF' }}>
            {gpsActive ? 'GPS tracking active' : 'GPS not available'}
          </span>
        </div>

        {/* Mark Resolved */}
        <motion.button
          onClick={handleMarkResolved}
          disabled={resolvingFinal}
          whileHover={{ scale: 1.01, boxShadow: '0 8px 24px rgba(22,163,74,0.25)' }}
          whileTap={{ scale: 0.98 }}
          style={{
            width: '100%', height: 52,
            background: resolvingFinal ? '#D1FAE5' : '#16A34A',
            color: 'white', border: 'none', borderRadius: 12,
            fontSize: 15, fontWeight: 700, cursor: resolvingFinal ? 'default' : 'pointer',
            boxShadow: '0 4px 16px rgba(22,163,74,0.2)',
          }}
        >
          {resolvingFinal ? 'Marking as resolved…' : '✓ Mark as Resolved'}
        </motion.button>
      </div>
    </div>
  )
}
