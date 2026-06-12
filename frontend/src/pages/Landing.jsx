import { useEffect, useState, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, Shield, Globe, Cpu, MapPin,
  Users, Building, UserCheck, CheckCircle2, AlertTriangle,
  Zap, Clock, Phone, Mail, ChevronRight, MessageSquare
} from 'lucide-react'
import { BHASHINI_LANGUAGES } from '../utils/constants'

/* ── Shared Animation Config ── */
const easeOut = [0.16, 1, 0.3, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (d = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.8, delay: d, ease: easeOut }
  })
}
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
}

/* ═══════════════════════════════════════════════════════════════════════════
   NAVIGATION — Sticky, precise blur
   ═══════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════
   HERO — Dense, multi-layered, floating elements, rich background
   ═══════════════════════════════════════════════════════════════════════════ */
function HeroSection() {
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('aura_token')
  const nodeNames = ['Input', 'Supervisor', 'Translate', 'Classify', 'Route', 'Auditor', 'Resolution', 'Learn']
  const [activeNode, setActiveNode] = useState(-1)
  const [doneNodes, setDoneNodes] = useState([])

  useEffect(() => {
    let i = 0, cancelled = false
    const fire = () => {
      if (cancelled) return
      setActiveNode(i)
      setTimeout(() => {
        if (cancelled) return
        setDoneNodes(p => [...p, i])
        i++
        if (i < nodeNames.length) setTimeout(fire, 400)
        else setTimeout(() => { if (!cancelled) { setActiveNode(-1); setDoneNodes([]); i = 0; setTimeout(fire, 800) } }, 1200)
      }, 500)
    }
    const t = setTimeout(fire, 1000)
    return () => { cancelled = true; clearTimeout(t) }
  }, [])

  return (
    <section style={{
      minHeight: '100vh', paddingTop: 64, display: 'flex', alignItems: 'center',
      position: 'relative', overflow: 'hidden', background: 'var(--bg-page)',
    }}>
      {/* city.jpeg background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <img src="/images/city.jpeg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.07 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, var(--bg-page) 40%, rgba(250,249,246,0.85) 100%)' }} />
      </div>

      {/* dot grid overlay */}
      <div className="dot-grid" style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.4, maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)' }} />

      {/* building.jpeg right-edge depth */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '35%', height: '100%', zIndex: 0, opacity: 0.04, overflow: 'hidden' }}>
        <img src="/images/building.jpeg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 32px', width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 64, alignItems: 'center', position: 'relative', zIndex: 1 }}>
          
          {/* Left Column Text */}
          <div>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ marginBottom: 32 }}>
              <div className="tag" style={{ background: 'white', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)', padding: '6px 16px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>PS-11 · Agentic AI · SDG 16 + 11 + 10</span>
              </div>
            </motion.div>

            <h1 style={{ marginBottom: 28, lineHeight: 1.05 }}>
              <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
                {['Governments', 'react.'].map((w, i) => (
                  <motion.span key={i} variants={{ hidden: { y: 40, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: easeOut } } }} style={{ display: 'inline-block', fontSize: 'clamp(56px, 6vw, 88px)', fontWeight: 300, color: '#6B6B6B', letterSpacing: '-0.04em', marginRight: 20 }}>{w}</motion.span>
                ))}
              </motion.div>
              <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } }}>
                {['AURA', 'acts.'].map((w, i) => (
                  <motion.span key={i} variants={{ hidden: { y: 40, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: easeOut } } }} style={{ display: 'inline-block', fontSize: 'clamp(64px, 7vw, 100px)', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.05em', marginRight: 24 }}>{w}</motion.span>
                ))}
              </motion.div>
            </h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }} style={{ fontSize: 19, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 540, marginBottom: 48, fontWeight: 400 }}>
              An autonomous 8-agent AI system that classifies, routes, and resolves public grievances in 22 Indian languages — in 30 seconds, with full accountability.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.8 }} style={{ display: 'flex', gap: 16, marginBottom: 56, flexWrap: 'wrap' }}>
              {isLoggedIn ? (
                <>
                  <motion.button className="btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/submit')} style={{ padding: '16px 32px', fontSize: 16 }}>
                    File a Complaint <ArrowRight size={18} />
                  </motion.button>
                  <motion.button className="btn-ghost" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/citizen')} style={{ padding: '16px 32px', fontSize: 16, background: 'white' }}>
                    My Dashboard
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button className="btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/register')} style={{ padding: '16px 32px', fontSize: 16 }}>
                    Register Free <ArrowRight size={18} />
                  </motion.button>
                  <motion.button className="btn-ghost" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/submit')} style={{ padding: '16px 32px', fontSize: 16, background: 'white' }}>
                    File Without Account
                  </motion.button>
                </>
              )}
            </motion.div>

          </div>

          {/* Right Column — Rich floating cards */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: easeOut }}
            style={{ position: 'relative', height: 580 }}
          >
            {/* Blur circle */}
            <div style={{ position: 'absolute', top: '20%', left: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(91,76,245,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

            {/* MAIN CARD — Live Agent Pipeline */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ position: 'absolute', top: 0, left: 40, right: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 20, padding: '24px 28px', boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)', zIndex: 3, transform: 'rotate(1deg)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Live Agent Pipeline</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(22,163,74,0.08)', padding: '4px 10px', borderRadius: 20 }}>
                  <div className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#16A34A', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>PROCESSING</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {nodeNames.map((name, i) => {
                  const active = activeNode === i
                  const done = doneNodes.includes(i)
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <motion.div
                        animate={{ background: done ? 'rgba(22,163,74,0.10)' : active ? 'rgba(91,76,245,0.12)' : 'rgba(0,0,0,0.04)', borderColor: done ? 'rgba(22,163,74,0.4)' : active ? 'rgba(91,76,245,0.5)' : 'rgba(0,0,0,0.08)' }}
                        transition={{ duration: 0.3 }}
                        style={{ padding: '5px 12px', borderRadius: 8, border: '1.5px solid', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: done ? '#16A34A' : active ? '#5B4CF5' : '#9CA3AF', display: 'flex', alignItems: 'center', gap: 5 }}
                      >
                        <div style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: done ? '#16A34A' : active ? '#5B4CF5' : '#D1D5DB', boxShadow: active ? '0 0 6px rgba(91,76,245,0.6)' : 'none' }} />
                        {name}
                      </motion.div>
                      {i < nodeNames.length - 1 && (
                        <div style={{ width: 8, height: 1, background: done ? 'rgba(22,163,74,0.3)' : 'rgba(0,0,0,0.1)', flexShrink: 0 }} />
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* COMPLAINT IMAGE CARD — real pothole photo */}
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              style={{ position: 'absolute', top: 200, left: 0, width: 220, background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.14)', zIndex: 4, transform: 'rotate(-2deg)' }}
            >
              <img src="/images/pothole.jpeg" alt="Road damage complaint" style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
              <div style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#EA580C', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#EA580C', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>ANOMALY DETECTED</span>
                </div>
                <div style={{ fontSize: 12, color: '#111', fontWeight: 600, lineHeight: 1.4, marginBottom: 3 }}>15 complaints · Ward 14</div>
                <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.4 }}>AI: drainage infrastructure failure</div>
              </div>
            </motion.div>

            {/* RESOLUTION CARD */}
            <motion.div
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
              style={{ position: 'absolute', bottom: 60, right: 0, width: 260, background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderLeft: '3px solid #16A34A', borderRadius: 16, padding: '16px 18px', boxShadow: '0 16px 48px rgba(0,0,0,0.12)', zIndex: 4, transform: 'rotate(1deg)' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(22,163,74,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#16A34A', marginBottom: 4 }}>Resolution Confirmed</div>
                  <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.5, marginBottom: 6 }}>Both citizen & officer validated fix. SLA met: <strong style={{ color: '#16A34A' }}>2h 15m</strong>.</div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#9CA3AF' }}>ID: GR-2026-0847</div>
                </div>
              </div>
            </motion.div>

            {/* MINI STATS ROW */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              style={{ position: 'absolute', bottom: 0, left: 40, right: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, zIndex: 2 }}
            >
              {[
                { label: 'Classified in', value: '<30 sec', color: '#5B4CF5' },
                { label: 'Languages', value: '22 Indian', color: '#16A34A' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 12, padding: '12px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono)', color: s.color, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROBLEM / SOLUTION — Dense overlapped grid to remove gaps
   ═══════════════════════════════════════════════════════════════════════════ */
function ProblemSection() {
  const withoutItems = [
    'Complaints sit in a queue for weeks with no routing',
    '70% get sent to the wrong department',
    'Citizens get one auto-reply and never hear back',
    'No one detects when 200 people have the same problem'
  ]
  const withItems = [
    'Classified and routed to correct dept in under 30 seconds',
    '22 Indian languages understood natively via Bhashini',
    'Citizen gets WhatsApp update at every stage change',
    'Patterns across complaints auto-detected and escalated'
  ]

  return (
    <section style={{ background: 'var(--bg-muted)', padding: '120px 0', position: 'relative' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={fadeUp} style={{ textAlign: 'center', marginBottom: 72 }}>
          <div className="tag" style={{ background: 'white', border: '1px solid var(--border)', marginBottom: 20 }}>The Architecture Shift</div>
          <h2 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.03em', lineHeight: 1.1, maxWidth: 800, margin: '0 auto' }}>
            The system that didn't exist — until now
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, background: 'var(--bg-surface)', borderRadius: 32, overflow: 'hidden', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)' }}>
          {/* WITHOUT */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} style={{ padding: '64px 48px', background: '#FAFAFA', borderRight: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--sev-crit-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={24} style={{ color: 'var(--sev-critical)' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--sev-critical)', letterSpacing: '0.08em' }}>STANDARD SYSTEM</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)' }}>Manual & Slow</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {withoutItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--sev-crit-bg)', color: 'var(--sev-critical)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 800, marginTop: 2 }}>✕</div>
                  <span style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, fontWeight: 500 }}>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* WITH */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0.2} style={{ padding: '64px 48px', background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={24} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em' }}>WITH AURA</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)' }}>Autonomous & Instant</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {withItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--sev-low-bg)', color: 'var(--sev-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <CheckCircle2 size={14} strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: 16, color: 'var(--text-primary)', lineHeight: 1.6, fontWeight: 500 }}>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE 8 AGENTS — Rich layered grid with real icon images
   ═══════════════════════════════════════════════════════════════════════════ */
function AgentsSection() {
  const agents = [
    { n: '01', name: 'Input Agent', desc: 'Accepts complaints via WhatsApp, web, or voice in 22 Indian languages. Strips personal information before any AI processing.', chips: ['Bhashini API', 'Whisper STT', 'PII Filter'], icon: '/images/whatsapp message notification icon flat.jpeg', iconBg: 'rgba(91,76,245,0.08)', accentColor: '#5B4CF5', borderColor: 'rgba(91,76,245,0.15)' },
    { n: '02', name: 'Supervisor Agent', desc: 'A lightweight model scans every input for prompt injection attacks before the main AI sees it. Zero-trust, always on.', chips: ['GPT-4o-mini', 'Zero Trust'], icon: '/images/security shield check icon.jpeg', iconBg: 'rgba(220,38,38,0.08)', accentColor: '#DC2626', borderColor: 'rgba(220,38,38,0.15)' },
    { n: '03', name: 'Translation Agent', desc: 'Bhashini API converts any Indian language to English in real time. A complaint in Santali reaches an officer in English.', chips: ['Bhashini', '22 Languages'], icon: '/images/google translate languages icon.png', iconBg: 'rgba(59,130,246,0.08)', accentColor: '#3B82F6', borderColor: 'rgba(59,130,246,0.15)' },
    { n: '04', name: 'Classification Agent', desc: 'GPT-4o applies the Impact Matrix — category, severity, urgency — and returns structured output with a confidence score.', chips: ['GPT-4o', 'Impact Matrix', 'Sentiment'], icon: '/images/AI categorization sorting icon.jpeg', iconBg: 'rgba(91,76,245,0.08)', accentColor: '#5B4CF5', borderColor: 'rgba(91,76,245,0.15)' },
    { n: '05', name: 'Routing Agent', desc: 'GPS pincode maps to the exact responsible sub-department with officer assigned. SLA countdown timer starts immediately.', chips: ['PostGIS', 'Redis SLA'], icon: '/images/gps map pin location icon.jpg', iconBg: 'rgba(22,163,74,0.08)', accentColor: '#16A34A', borderColor: 'rgba(22,163,74,0.15)' },
    { n: '06', name: 'Systemic Auditor', desc: 'Runs clustering across all complaints. 15+ similar complaints from one area triggers a systemic failure alert to the Councillor.', chips: ['DBSCAN', 'Sentence-Transformers'], icon: '/images/cluster data pattern analysis icon.png', iconBg: 'rgba(234,88,12,0.08)', accentColor: '#EA580C', borderColor: 'rgba(234,88,12,0.15)' },
    { n: '07', name: 'Resolution Agent', desc: 'Both the officer and the citizen must confirm resolution. If citizen says NO the complaint auto-escalates. No silent closes.', chips: ['Dual-Key', 'WhatsApp'], icon: '/images/dual signature checkmark confirm icon.jpg', iconBg: 'rgba(22,163,74,0.08)', accentColor: '#16A34A', borderColor: 'rgba(22,163,74,0.15)' },
    { n: '08', name: 'Feedback Agent', desc: 'Every officer correction is logged. Classification accuracy is tracked live. The system learns from every human override.', chips: ['RLHF', 'Accuracy Tracking'], icon: '/images/machine learning feedback loop icon.png', iconBg: 'rgba(91,76,245,0.08)', accentColor: '#5B4CF5', borderColor: 'rgba(91,76,245,0.15)' },
  ]

  return (
    <section style={{ background: 'var(--bg-page)', padding: '120px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={fadeUp} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 64, flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div className="tag" style={{ background: 'white', border: '1px solid var(--border)', marginBottom: 20 }}>Architecture</div>
            <h2 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              8 autonomous agents.<br />One complaint.
            </h2>
          </div>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 400, fontWeight: 500, lineHeight: 1.5, margin: 0 }}>
            Each agent observes, decides, and acts — entirely eliminating bureaucratic wait times.
          </p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={staggerContainer} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {agents.map((a, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              whileHover={{ y: -6, boxShadow: `0 20px 60px ${a.accentColor}18, 0 4px 16px rgba(0,0,0,0.08)`, borderColor: a.borderColor }}
              transition={{ duration: 0.25 }}
              style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-xl)', padding: '28px 24px',
                cursor: 'default', position: 'relative', overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column',
                transition: 'all 0.25s ease',
              }}
            >
              {/* Top accent line */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${a.accentColor}, ${a.accentColor}00)`, borderRadius: 'var(--r-xl) var(--r-xl) 0 0' }} />

              {/* Icon + number row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ width: 72, height: 72, borderRadius: 'var(--r-md)', background: a.iconBg, border: `1px solid ${a.accentColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={a.icon} alt={a.name} loading="lazy" style={{ width: 52, height: 52, objectFit: 'contain' }} />
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: a.accentColor, background: a.iconBg, padding: '4px 8px', borderRadius: 'var(--r-full)', letterSpacing: '0.04em', opacity: 0.8 }}>
                  {a.n}
                </div>
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, letterSpacing: '-0.02em', lineHeight: 1.3 }}>{a.name}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 20, flex: 1 }}>{a.desc}</p>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {a.chips.map((c, j) => (
                  <span key={j} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 500, padding: '4px 10px', borderRadius: 'var(--r-full)', background: a.iconBg, color: a.accentColor, border: `1px solid ${a.accentColor}25`, letterSpacing: '0.01em' }}>
                    {c}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   LIVE SCENARIO — Overlapping, scroll-locked flow
   ═══════════════════════════════════════════════════════════════════════════ */
function ScenarioSection() {
  const steps = [
    {
      title: 'Received via WhatsApp', sub: 'Citizen files complaint in Hindi. Instant ingestion.',
      visual: (
        <div style={{ position: 'relative', height: 180, borderRadius: 'var(--r-xl)', overflow: 'hidden', maxWidth: 340, boxShadow: 'var(--shadow-md)' }}>
          <img src="/images/whatsapp.jpeg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="WhatsApp complaint" />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%)' }} />
          <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>WhatsApp Group · 2:13 AM</div>
            <div style={{ fontSize: 14, color: 'white', fontWeight: 500, lineHeight: 1.4 }}>Ward 14 mai 5 din se kachra nahi utha — koi jawab nahi</div>
            <div style={{ fontSize: 11, color: '#ef4444', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>No response after 3 hours</div>
          </div>
        </div>
      )
    },
    {
      title: 'AURA Pipeline Activates', sub: 'Translated, Classified, and Routed in 3.4 seconds.',
      visual: (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 24, padding: 32, boxShadow: 'var(--shadow-xl)', width: '100%' }}>
           <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[{ icon: Globe, t: 'Translate: English', c: 'var(--accent)' }, { icon: Cpu, t: 'Classify: Sanitation · HIGH', c: 'var(--sev-high)' }, { icon: MapPin, t: 'Route: GHMC Ward 14', c: 'var(--sev-low)' }].map((x,i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 16, borderBottom: i<2?'1px solid var(--border)':'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <x.icon size={16} style={{ color: x.c }} />
                </div>
                <span style={{ fontSize: 15, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{x.t}</span>
              </div>
            ))}
           </div>
        </div>
      )
    },
    {
      title: 'Resolution & Audit', sub: 'Officer fixes. Citizen confirms. Closed.',
      visual: (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 24, padding: 32, boxShadow: 'var(--shadow-xl)', width: '100%', borderLeft: '6px solid var(--sev-low)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <CheckCircle2 size={24} style={{ color: 'var(--sev-low)' }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--sev-low)' }}>Confirmed Resolved</span>
          </div>
          <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>Both nodes (Citizen, Officer) provided cryptographic confirmation.</div>
          <div style={{ background: 'var(--bg-muted)', padding: '12px 16px', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'space-between' }}>
            <span>SLA: Met (14h 20m)</span>
            <span style={{ color: 'var(--accent)' }}>View Trail</span>
          </div>
        </div>
      )
    }
  ]

  return (
    <section style={{ background: '#111111', padding: '120px 0', position: 'relative', overflow: 'hidden' }}>
      {/* Background glowing orb */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', width: '100vw', height: '100vw', minWidth: 1000, background: 'radial-gradient(circle, rgba(91,76,245,0.15) 0%, transparent 60%)', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }} />
      
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', position: 'relative', zIndex: 10 }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={fadeUp} style={{ textAlign: 'center', marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Watch AURA in action
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 32, maxWidth: 800, margin: '0 auto' }}>
          {steps.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 50, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: '-150px' }} transition={{ duration: 0.8, ease: easeOut }} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 32, padding: 48, display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 48, alignItems: 'center', backdropFilter: 'blur(20px)' }}>
              <div>
                <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 12 }}>STEP {i+1}</div>
                <h3 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 12, lineHeight: 1.2, letterSpacing: '-0.02em' }}>{s.title}</h3>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{s.sub}</p>
              </div>
              <div style={{ filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.4))' }}>{s.visual}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   WHO USES AURA
   ═══════════════════════════════════════════════════════════════════════════ */
function UsersSection() {
  const navigate = useNavigate()
  const roles = [
    { icon: Users, title: 'Citizen', desc: 'File a complaint in your language. Get WhatsApp updates at every step. Confirm it is fixed. Earn Impact Points for making the city better.', cta: 'Register Free', path: '/register', secondaryCta: 'Already registered? Login', secondaryPath: '/login', featured: false, img: '/images/citizen.jpeg' },
    { icon: UserCheck, title: 'Ward Officer', desc: 'Your queue sorted by severity. SLA countdowns live. Cluster alerts instant. Every correction improves the AI.', cta: 'Officer Login', path: '/officer/login', featured: true, img: '/images/indian government ward office.jpeg' },
    { icon: Building, title: 'Ward Admin', desc: 'Live view of your ward. Systemic failures detected before they become crises. Full accountability trail.', cta: 'Admin Dashboard', path: '/admin', featured: false, img: '/images/meeting.jpeg' },
  ]

  return (
    <section style={{ background: 'var(--bg-muted)', padding: '120px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={fadeUp} style={{ textAlign: 'center', marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Built for everyone in the chain
          </h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={staggerContainer} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {roles.map((r, i) => (
            <motion.div key={i} variants={fadeUp} whileHover={{ y: -8 }} style={{ background: r.featured ? 'var(--accent)' : 'var(--bg-surface)', borderRadius: 32, padding: 48, boxShadow: 'var(--shadow-xl)', border: r.featured ? 'none' : '1px solid var(--border)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 160, margin: '-36px -30px 24px -30px', overflow: 'hidden', borderRadius: 'var(--r-xl) var(--r-xl) 0 0', position: 'relative' }}>
                <img src={r.img} alt={r.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: r.featured ? 'linear-gradient(to bottom, transparent, rgba(91,76,245,0.95))' : 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.95))' }} />
              </div>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: r.featured ? 'rgba(255,255,255,0.1)' : 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
                <r.icon size={28} style={{ color: r.featured ? 'white' : 'var(--text-heading)' }} />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: r.featured ? 'white' : 'var(--text-heading)', marginBottom: 16, letterSpacing: '-0.01em' }}>{r.title}</h3>
              <p style={{ fontSize: 16, color: r.featured ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)', lineHeight: 1.6, flex: 1, marginBottom: 40, fontWeight: 500 }}>{r.desc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={() => navigate(r.path)} style={{ background: r.featured ? 'white' : 'var(--bg-muted)', color: r.featured ? 'var(--accent)' : 'var(--text-heading)', border: 'none', padding: '16px 24px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s ease', width: '100%' }}>
                  {r.cta} <ArrowRight size={18} />
                </button>
                {r.secondaryCta && (
                  <button onClick={() => navigate(r.secondaryPath)} style={{ background: 'transparent', color: r.featured ? 'rgba(255,255,255,0.6)' : 'var(--text-tertiary)', border: 'none', padding: '8px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'center', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                    {r.secondaryCta}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SDG STRIP & CTA
   ═══════════════════════════════════════════════════════════════════════════ */
function BottomSection() {
  const navigate = useNavigate()
  return (
    <>
      <section style={{ background: 'var(--accent)', padding: '80px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48 }}>
            {[
              { n: '16', name: 'Peace, Justice and Strong Institutions', desc: 'Every complaint routed. Every SLA tracked. Accountability built in.' },
              { n: '11', name: 'Sustainable Cities and Communities', desc: 'Roads, water, sanitation, electricity — resolved in hours not months.' },
              { n: '10', name: 'Reduced Inequalities', desc: 'A citizen filing in Santali gets the same response as one filing in English.' }
            ].map((s, i) => (
              <div key={i} style={{ paddingRight: i < 2 ? 48 : 0, borderRight: i < 2 ? '1px solid rgba(255,255,255,0.15)' : 'none' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em', marginBottom: 12 }}>SDG {s.n}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 12, lineHeight: 1.3 }}>{s.name}</div>
                <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, fontWeight: 400 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ height: 220, position: 'relative', overflow: 'hidden' }}>
        <img src="/images/building.jpeg" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} alt="Municipal building" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, var(--bg-muted), rgba(250,249,246,0.1) 40%, var(--bg-surface))' }} />
      </div>

      <section style={{ background: 'var(--bg-surface)', padding: '140px 0', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 32px' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 style={{ fontSize: 'clamp(44px, 6vw, 72px)', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 24 }}>
              AURA is ready.<br />Your ward is waiting.
            </h2>
            <p style={{ fontSize: 20, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 48, fontWeight: 400 }}>
              Deployable at ward level today. No government API permission required. CPGRAMS-compatible architecture.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button className="btn-primary" onClick={() => navigate('/submit')} style={{ padding: '18px 40px', fontSize: 18, borderRadius: 16 }}>File a Complaint</button>
              <button className="btn-ghost" onClick={() => navigate('/officer/login')} style={{ padding: '18px 40px', fontSize: 18, borderRadius: 16 }}>Officer Login</button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer style={{ background: '#0A0A0A', color: 'rgba(255,255,255,0.6)', padding: '80px 0 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 64, paddingBottom: 64 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontWeight: 800, fontSize: 16, fontFamily: 'var(--font-mono)' }}>A</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: 20, color: 'white', letterSpacing: '-0.02em' }}>AURA</span>
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 12, fontWeight: 500 }}>Agentic Unified Resolution Architecture</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>PS-11 · CBIT Hackathon 2026</div>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 24, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Contact & Support</div>
            <div style={{ fontSize: 15, lineHeight: 2.2, fontWeight: 500 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Mail size={16} style={{ color: 'var(--accent)' }}/> aura.grievance@cbit.ac.in</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Phone size={16} style={{ color: 'var(--accent)' }}/> 1800-XXX-XXXX (toll free)</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>For technical issues with complaint submission</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 24, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Aligned with Digital India</div>
            <div style={{ fontSize: 15, lineHeight: 2.2, fontWeight: 500 }}>
              <div>CPGRAMS Compatible Architecture</div>
              <div>Built on API Setu Standards</div>
              <div>SDG 16 · 11 · 10</div>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '32px 0', fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontWeight: 500 }}>
          © 2026 AURA · PS-11 Hackathon · Built for citizens of India
        </div>
      </div>
    </footer>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function Landing() {
  return (
    <div style={{ fontFamily: 'var(--font-sans)', background: 'var(--bg-page)', minHeight: '100vh', color: 'var(--text-primary)' }}>
            <HeroSection />
      <ProblemSection />
      <AgentsSection />
      <ScenarioSection />
      <UsersSection />
      <BottomSection />
      <Footer />
    </div>
  )
}
