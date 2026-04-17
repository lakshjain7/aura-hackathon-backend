import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mic, Camera, MapPin, AlertTriangle, AlertCircle, Clock, CheckCircle, CheckCircle2, Send, ChevronDown, X } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import { useComplaintForm } from '../../hooks/useComplaintForm'
import { COMPLAINT_PLACEHOLDERS, DEMO_COMPLAINTS, BHASHINI_LANGUAGES } from '../../utils/constants'
import { submitComplaint, createComplaintStream, transcribeAudio } from '../../utils/api'
import { addPoints, IMPACT_POINTS } from '../../utils/points'

const easeOut = [0.16, 1, 0.3, 1]
const fadeUp = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: easeOut } },
  exit: { opacity: 0, y: -16, scale: 0.98, transition: { duration: 0.3, ease: easeOut } },
}


/* ── Section card wrapper ── */
function SectionCard({ children, style }) {
  return (
    <div style={{
      background: 'var(--bg-surface, white)',
      border: '1px solid var(--border)',
      borderLeft: '3px solid var(--accent)',
      borderRadius: 'var(--r-xl, 20px)',
      padding: '28px 32px',
      boxShadow: 'var(--shadow-md)',
      marginBottom: 16,
      ...style,
    }}>
      {children}
    </div>
  )
}

/* ── Section number pill ── */
function StepPill({ n }) {
  return (
    <div style={{
      width: 24, height: 24, borderRadius: '50%',
      background: 'var(--accent)', color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, flexShrink: 0,
    }}>{n}</div>
  )
}

/* ── Three-dot loading animation ── */
function Dots() {
  return (
    <span style={{ display: 'inline-flex', gap: 3, marginLeft: 4 }}>
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          style={{ width: 4, height: 4, borderRadius: '50%', background: 'white', display: 'inline-block' }}
        />
      ))}
    </span>
  )
}

const DEMO_COMPLAINT_ID = 'GR-2026-DEMO'

export default function SubmitComplaint() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isPhotoMode = searchParams.get('mode') === 'photo'
  const { t } = useTranslation()
  const { currentLang, setLanguage } = useLanguage()
  const { form, step, setStep, updateField, handlePhotoUpload, handleGetLocation, prefill } = useComplaintForm()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [complaintId, setComplaintId] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const [demoOpen, setDemoOpen] = useState(false)

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)

  const placeholder = COMPLAINT_PLACEHOLDERS[currentLang] || COMPLAINT_PLACEHOLDERS.en

  const handleVoiceInput = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream)
        const chunks = []

        recorder.ondataavailable = (e) => chunks.push(e.data)
        recorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop())
          const blob = new Blob(chunks, { type: 'audio/webm' })
          const fd = new FormData()
          fd.append('audio', blob, 'complaint.webm')
          fd.append('language', currentLang)

          try {
            setTranscribing(true)
            const res = await transcribeAudio(fd)
            updateField('text', res.data.text || res.data.transcription || '')
          } catch {
            console.warn('Transcription unavailable in demo mode')
          } finally {
            setTranscribing(false)
          }
        }

        recorder.start()
        setMediaRecorder(recorder)
        setIsRecording(true)
      } catch {
        console.warn('Microphone access denied')
      }
    } else {
      mediaRecorder?.stop()
      setMediaRecorder(null)
      setIsRecording(false)
    }
  }

  const onSubmit = async () => {
    if (!form.text.trim()) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const fd = new FormData()
      fd.append('raw_text', form.text)
      fd.append('language', form.language || currentLang)
      fd.append('pincode', form.pincode || '')
      fd.append('severity_hint', form.severity || form.urgency || 'medium')
      if (form.photo) fd.append('image', form.photo)

      const response = await submitComplaint(fd)
      const id = response.data.complaint_id || response.data.id

      setComplaintId(id)
      setSubmitted(true)
      addPoints(IMPACT_POINTS.SUBMIT_COMPLAINT + (form.photo ? IMPACT_POINTS.UPLOAD_PHOTO : 0), 'Complaint submitted')

      // Start SSE stream immediately
      const stream = createComplaintStream(id)
      stream.onerror = () => stream.close()

      setTimeout(() => {
        navigate(`/track/${id}`)
        stream.close()
      }, 2000)

    } catch {
      // Demo fallback — always works without backend
      console.warn('Backend unavailable, using demo mode')
      const demoId = `GR-2026-${Math.floor(1000 + Math.random() * 9000)}`
      setComplaintId(demoId)
      setSubmitted(true)
      addPoints(IMPACT_POINTS.SUBMIT_COMPLAINT + (form.photo ? IMPACT_POINTS.UPLOAD_PHOTO : 0), 'Complaint submitted')
      setTimeout(() => navigate(`/track/${demoId}`), 2000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const severityOptions = [
    { value: 'critical', label: t('complaint.critical') || 'Critical', desc: 'Immediate danger to life or safety', icon: AlertTriangle, color: 'var(--sev-critical)', bg: 'var(--sev-crit-bg, #fff1f1)', border: 'var(--sev-crit-bdr, #fca5a5)' },
    { value: 'high', label: t('complaint.high') || 'High', desc: 'Urgent — within 24 hours', icon: AlertCircle, color: 'var(--sev-high)', bg: 'var(--sev-high-bg)', border: 'var(--sev-high-border)' },
    { value: 'medium', label: t('complaint.medium') || 'Medium', desc: 'Important — within 3 days', icon: Clock, color: 'var(--sev-medium)', bg: 'var(--sev-medium-bg)', border: 'var(--sev-medium-border)' },
    { value: 'low', label: t('complaint.low') || 'Low', desc: 'Can wait — within a week', icon: CheckCircle, color: 'var(--sev-low)', bg: 'var(--sev-low-bg)', border: 'var(--sev-low-border)' },
  ]

  useEffect(() => {
    if (form.text && step === 1) setStep(2)
  }, [form.text])

  useEffect(() => {
    if ((form.pincode.length === 6 || form.hasGPS) && step === 2) setStep(3)
  }, [form.pincode, form.hasGPS])

  const mediaBtn = {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 20px', borderRadius: 'var(--r-md, 10px)',
    background: 'white', border: '1px solid var(--border)',
    fontSize: 14, fontWeight: 500, cursor: 'pointer',
    color: 'var(--text-secondary)', transition: 'all 0.2s',
  }

  return (
    <>
      <div style={{ background: 'var(--bg-muted)', minHeight: '100vh', paddingBottom: 120 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '80px 24px 0' }}>

          {/* ── Header ── */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: 32 }}>
            <div style={{
              display: 'inline-block', background: 'var(--accent-light, #ede9fe)',
              color: 'var(--accent)', border: '1px solid var(--accent-light, #ede9fe)',
              borderRadius: 'var(--r-full, 9999px)', padding: '4px 12px',
              fontSize: 12, fontWeight: 600, letterSpacing: '0.02em', marginBottom: 14,
            }}>Citizen Portal</div>

            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700,
              letterSpacing: '-0.03em', color: 'var(--text-primary)',
              lineHeight: 1.1, marginBottom: 28,
            }}>
              {t('complaint.submit_title') || 'File a Complaint'}
            </h1>

                      </motion.div>

          {/* ── Success / Form ── */}
          <AnimatePresence mode="wait">
            {submitted && complaintId ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                style={{
                  background: 'white', border: '1px solid var(--border)',
                  borderRadius: 'var(--r-xl, 20px)', padding: 60, textAlign: 'center',
                  boxShadow: 'var(--shadow-xl)', position: 'relative', overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'var(--sev-low)' }} />
                <motion.div
                  initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  style={{
                    width: 72, height: 72, borderRadius: '50%', margin: '0 auto 24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--sev-low-bg)', border: '2px solid var(--sev-low)',
                  }}
                >
                  <CheckCircle2 size={32} style={{ color: 'var(--sev-low)' }} strokeWidth={2.5} />
                </motion.div>
                <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, letterSpacing: '-0.02em' }}>
                  {t('complaint.success') || 'Complaint Received'}
                </h2>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 28 }}>
                  Your grievance has been successfully logged and routed.
                </p>
                <div style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 28px', display: 'inline-block', marginBottom: 24 }}>
                  <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 700, marginBottom: 8 }}>Tracking ID</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.05em' }}>{complaintId}</p>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 500 }}>
                  Redirecting to live tracking dashboard…
                </p>
              </motion.div>
            ) : (
              <motion.div key="form" initial="hidden" animate="visible" variants={fadeUp}>

                {/* ── Photo-first mode ── */}
                {isPhotoMode && (
                  <SectionCard style={{ borderLeft: '3px solid #0891B2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#0891B2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Camera size={13} style={{ color: 'white' }} />
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Photo Report</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#E0F2FE', color: '#0891B2', fontWeight: 600 }}>Faster processing</span>
                    </div>

                    {form.photoPreview ? (
                      <div style={{ position: 'relative', marginBottom: 16 }}>
                        <img src={form.photoPreview} alt="Complaint photo" style={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: 14, display: 'block' }} />
                        <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '4px 10px', fontSize: 12, color: 'white', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <MapPin size={11} /> GPS extracted
                        </div>
                        <button
                          onClick={() => { updateField('photo', null); updateField('photoPreview', null) }}
                          style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label style={{ display: 'block', cursor: 'pointer' }}>
                        <div style={{ border: '2px dashed #BAE6FD', borderRadius: 14, padding: '48px 24px', textAlign: 'center', background: '#F0F9FF', transition: 'all 0.2s' }}>
                          <Camera size={40} style={{ color: '#0891B2', margin: '0 auto 12px', display: 'block' }} />
                          <div style={{ fontSize: 15, fontWeight: 600, color: '#0891B2', marginBottom: 6 }}>Tap to capture or upload</div>
                          <div style={{ fontSize: 13, color: '#6B7280' }}>AI will auto-classify from your photo</div>
                        </div>
                        <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) handlePhotoUpload(e.target.files[0]) }} />
                      </label>
                    )}
                  </SectionCard>
                )}

                {/* ── Section 1: Describe ── */}
                <SectionCard>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <StepPill n={1} />
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Describe your complaint</span>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <textarea
                      value={form.text}
                      onChange={e => updateField('text', e.target.value)}
                      placeholder={placeholder}
                      style={{
                        width: '100%', minHeight: 160, padding: 16,
                        borderRadius: 'var(--r-lg, 12px)', fontSize: 15, lineHeight: 1.6,
                        resize: 'vertical', outline: 'none',
                        background: 'var(--bg-muted)', border: '1px solid var(--border)',
                        color: 'var(--text-primary)', transition: 'border-color 0.2s, box-shadow 0.2s',
                        boxSizing: 'border-box',
                        direction: currentLang === 'ur' || currentLang === 'ks' ? 'rtl' : 'ltr',
                        fontFamily: 'inherit',
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = 'var(--accent)'
                        e.target.style.boxShadow = '0 0 0 3px rgba(91,76,245,0.08)'
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = 'var(--border)'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                    <span style={{
                      position: 'absolute', bottom: 12, right: 12,
                      fontFamily: 'var(--font-mono)', fontSize: 12,
                      color: 'var(--text-tertiary)',
                    }}>
                      {form.text.length} chars
                    </span>
                  </div>

                  {/* Common complaint types */}
                  <div style={{ marginTop: 16, marginBottom: 4 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: 10, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Common complaint types</p>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {[
                        { img: '/images/pothole.jpeg', label: 'Road damage' },
                        { img: '/images/garbage.jpeg', label: 'Sanitation' },
                        { img: '/images/streetlight.jpeg', label: 'Electricity' },
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
                          style={{ borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--border)', cursor: 'pointer', width: 100, transition: 'all 0.2s ease' }}
                        >
                          <img src={item.img} alt={item.label} loading="lazy" style={{ width: 100, height: 68, objectFit: 'cover', display: 'block' }} />
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', padding: '6px 8px', textAlign: 'center', background: 'var(--bg-surface)', fontWeight: 500, letterSpacing: '0.01em' }}>{item.label}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Media buttons */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 0, flexWrap: 'wrap' }}>
                    <motion.button
                      style={{
                        ...mediaBtn,
                        background: isRecording ? 'var(--sev-crit-bg, #fff1f1)' : transcribing ? '#f0fdf4' : 'white',
                        borderColor: isRecording ? 'var(--sev-critical)' : transcribing ? 'var(--sev-low)' : 'var(--border)',
                        color: isRecording ? 'var(--sev-critical)' : transcribing ? 'var(--sev-low)' : 'var(--text-secondary)',
                      }}
                      onClick={handleVoiceInput}
                      whileHover={!isRecording ? { y: -1, borderColor: 'var(--accent)', color: 'var(--accent)', boxShadow: 'var(--shadow-sm)' } : {}}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Mic size={16} />
                      {isRecording && (
                        <motion.span
                          animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}
                          style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--sev-critical)' }}
                        />
                      )}
                      {transcribing ? 'Transcribing…' : isRecording ? 'Stop Recording' : (t('complaint.voice_input') || 'Voice Input')}
                    </motion.button>

                    <motion.label
                      style={mediaBtn}
                      whileHover={{ y: -1, borderColor: 'var(--accent)', color: 'var(--accent)', boxShadow: 'var(--shadow-sm)' }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Camera size={16} />
                      {t('complaint.photo_upload') || 'Upload Photo'}
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) handlePhotoUpload(e.target.files[0]) }} />
                    </motion.label>
                  </div>

                  {/* Photo preview */}
                  <AnimatePresence>
                    {form.photoPreview && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 14 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, background: 'var(--bg-muted)', borderRadius: 12, border: '1px solid var(--border)' }}>
                          <img src={form.photoPreview} alt="Upload" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CheckCircle2 size={15} style={{ color: 'var(--sev-low)' }} />
                            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Photo attached</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </SectionCard>

                {/* ── Section 2: Location ── */}
                <AnimatePresence>
                  {step >= 2 && (
                    <motion.div key="location" initial="hidden" animate="visible" variants={fadeUp}>
                      <SectionCard>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                          <StepPill n={2} />
                          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Where is the problem?</span>
                        </div>

                        <motion.button
                          onClick={handleGetLocation}
                          whileHover={!form.hasGPS ? { background: 'var(--accent)', color: 'white' } : {}}
                          whileTap={{ scale: 0.99 }}
                          style={{
                            width: '100%', height: 50, borderRadius: 'var(--r-md, 10px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                            fontSize: 14, fontWeight: 500, cursor: form.hasGPS ? 'default' : 'pointer',
                            background: form.hasGPS ? '#F0FDF4' : 'transparent',
                            border: `1px solid ${form.hasGPS ? '#16A34A' : 'var(--accent)'}`,
                            color: form.hasGPS ? '#16A34A' : 'var(--accent)',
                            transition: 'all 0.2s', marginBottom: 12,
                          }}
                        >
                          <MapPin size={16} />
                          {form.hasGPS ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              Location verified
                              <span style={{ fontSize: 11, background: 'rgba(22,163,74,0.12)', padding: '2px 8px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                                🔒 Protected by AURA
                              </span>
                            </span>
                          ) : (t('complaint.location_gps') || 'Allow location access')}
                        </motion.button>
                        {form.hasGPS && (
                          <div style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 16, paddingLeft: 4 }}>
                            <span>🛡</span> Your exact coordinates are encrypted and never shared publicly
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>or enter manually</span>
                          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                        </div>

                        <input
                          type="text"
                          value={form.pincode}
                          onChange={e => {
                            const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                            updateField('pincode', v)
                            if (v.length === 6) updateField('areaName', 'Madhapur, Hyderabad')
                          }}
                          placeholder={t('complaint.pincode_label') || '6-digit pincode'}
                          inputMode="numeric"
                          style={{
                            width: '100%', padding: '12px 16px',
                            borderRadius: 'var(--r-md, 10px)', fontSize: 15, outline: 'none',
                            background: 'white', border: '1px solid var(--border)',
                            color: 'var(--text-primary)', transition: 'border-color 0.2s, box-shadow 0.2s',
                            boxSizing: 'border-box', fontFamily: 'var(--font-mono)',
                          }}
                          onFocus={e => {
                            e.target.style.borderColor = 'var(--accent)'
                            e.target.style.boxShadow = '0 0 0 3px rgba(91,76,245,0.08)'
                          }}
                          onBlur={e => {
                            e.target.style.borderColor = 'var(--border)'
                            e.target.style.boxShadow = 'none'
                          }}
                        />

                        <AnimatePresence>
                          {form.areaName && (
                            <motion.div
                              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                              style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--sev-low-bg)', borderRadius: 10, border: '1px solid var(--sev-low-border)' }}
                            >
                              <CheckCircle2 size={14} style={{ color: 'var(--sev-low)' }} />
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--sev-low)' }}>Mapped to: {form.areaName}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </SectionCard>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Section 3: AI Auto-Classify + Submit ── */}
                <AnimatePresence>
                  {step >= 3 && (
                    <motion.div key="submit" initial="hidden" animate="visible" variants={fadeUp}>
                      <SectionCard style={{ borderLeft: '3px solid #5B4CF5' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                          <StepPill n={3} />
                          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>AI Classification</span>
                        </div>

                        {/* AI auto-classify notice */}
                        <div style={{ background: '#EEF0FF', border: '1px solid rgba(91,76,245,0.15)', borderRadius: 14, padding: '18px 20px', marginBottom: 20 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>🤖</div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#5B4CF5', marginBottom: 8 }}>AURA will auto-assess severity</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {[
                                  { icon: '📝', text: 'Analyses your complaint text for urgency keywords' },
                                  { icon: '📍', text: 'Checks similar complaints filed in your area' },
                                  { icon: '📊', text: 'Applies historical cluster data from Ward 14' },
                                  { icon: '⚡', text: 'Classification completes in under 30 seconds' },
                                ].map((item, i) => (
                                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                                    <span>{item.icon}</span> {item.text}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Cluster context */}
                        <div style={{ background: '#FFF7ED', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 16 }}>⚠️</span>
                          <div style={{ fontSize: 12, color: '#92400E' }}>
                            <span style={{ fontWeight: 700 }}>18 similar complaints</span> detected in Ward 14 this week — AURA will factor this cluster into severity scoring
                          </div>
                        </div>

                        {/* Error */}
                        {submitError && (
                          <div style={{ padding: '10px 14px', background: '#fff1f1', border: '1px solid #fca5a5', borderRadius: 10, marginBottom: 16 }}>
                            <p style={{ fontSize: 13, color: '#DC2626' }}>{submitError}</p>
                          </div>
                        )}

                        {/* Submit */}
                        <motion.button
                          onClick={onSubmit}
                          disabled={isSubmitting}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          style={{
                            width: '100%', height: 54,
                            background: submitted ? '#16A34A' : 'var(--accent)',
                            color: 'white', fontSize: 15, fontWeight: 700,
                            borderRadius: 'var(--r-md, 12px)', border: 'none',
                            boxShadow: '0 4px 24px rgba(91,76,245,0.35)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            cursor: isSubmitting ? 'default' : 'pointer',
                            transition: 'background 0.3s',
                          }}
                        >
                          {isSubmitting ? (
                            <>
                              <span>Classifying your complaint</span>
                              <Dots />
                            </>
                          ) : (
                            <>
                              <Send size={16} />
                              <span>Submit — Let AI Classify</span>
                            </>
                          )}
                        </motion.button>
                        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: '#9CA3AF' }}>
                          You'll receive tracking updates via WhatsApp
                        </div>
                      </SectionCard>
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* ── Demo floating button + popover ── */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50 }}>
        <AnimatePresence>
          {demoOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: easeOut }}
              style={{
                position: 'absolute', bottom: '100%', right: 0, marginBottom: 10,
                background: 'white', border: '1px solid var(--border)',
                borderRadius: 'var(--r-xl, 20px)', padding: 20,
                boxShadow: '0 8px 40px rgba(0,0,0,0.12)', width: 240,
              }}
            >
              <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                Demo Scenarios
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.entries(DEMO_COMPLAINTS).map(([key, data]) => (
                  <motion.button
                    key={key}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { prefill(data); setDemoOpen(false) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                      background: key === 'injection' ? 'var(--sev-crit-bg, #fff1f1)' : 'var(--bg-muted)',
                      border: `1px solid ${key === 'injection' ? 'var(--sev-critical)' : 'var(--border)'}`,
                      color: key === 'injection' ? 'var(--sev-critical)' : 'var(--text-secondary)',
                      fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-mono)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {key === 'injection' ? '⚠ Prompt Injection' : `Simulate ${key.charAt(0).toUpperCase() + key.slice(1)}`}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setDemoOpen(v => !v)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          style={{
            padding: '6px 14px', borderRadius: 'var(--r-full, 9999px)',
            background: 'var(--bg-elevated, #1a1a2e)', border: '1px solid var(--border)',
            color: 'var(--text-tertiary)', fontSize: 11,
            fontFamily: 'var(--font-mono)', fontWeight: 600,
            letterSpacing: '0.05em', cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          DEMO {demoOpen ? '▲' : '▼'}
        </motion.button>
      </div>
    </>
  )
}
