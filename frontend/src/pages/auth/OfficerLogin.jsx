import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import { shake } from '../../animations/variants'
import api from '../../utils/api'

export default function OfficerLogin() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [transitioning, setTransitioning] = useState(false)
  const [clickPos, setClickPos] = useState({ x: 0, y: 0 })
  const btnRef = useRef(null)

  const doTransition = () => {
    const rect = btnRef.current?.getBoundingClientRect()
    setClickPos({ x: rect ? rect.left + rect.width / 2 : window.innerWidth / 2, y: rect ? rect.top + rect.height / 2 : window.innerHeight / 2 })
    setTransitioning(true)
    setTimeout(() => navigate('/officer'), 800)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await api.post('/api/auth/login', { email, password })
      const { token, officer_id, name } = res.data
      localStorage.setItem('aura_token', token)
      localStorage.setItem('aura_role', 'officer')
      if (officer_id) localStorage.setItem('aura_officer_id', officer_id)
      if (name) localStorage.setItem('aura_officer_name', name)
      doTransition()
    } catch {
      // Demo fallback — always works for hackathon
      if (email === 'officer@aura.gov.in' && password === 'demo') {
        localStorage.setItem('aura_token', 'demo_token')
        localStorage.setItem('aura_role', 'officer')
        localStorage.setItem('aura_officer_id', 'demo')
        localStorage.setItem('aura_officer_name', 'Rajesh K.')
        doTransition()
      } else {
        setError('Invalid credentials. Use officer@aura.gov.in / demo')
        setLoading(false)
      }
    }
  }

  const features = [
    { icon: '⚡', text: 'Auto-classified complaints' },
    { icon: '🗺️', text: 'Geospatial routing to your zone' },
    { icon: '🔔', text: 'Real-time systemic alerts' },
  ]

  const stats = [
    { value: '4,000+', label: 'Municipalities' },
    { value: '22', label: 'Languages' },
    { value: 'SDG 16', label: 'Aligned' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
      {/* ── Radial transition overlay ── */}
      {transitioning && (
        <motion.div
          style={{ position: 'fixed', zIndex: 50, borderRadius: '50%', background: 'var(--aura-bg-base)', left: clickPos.x, top: clickPos.y }}
          initial={{ width: 0, height: 0, x: 0, y: 0 }}
          animate={{ width: '300vmax', height: '300vmax', x: '-150vmax', y: '-150vmax' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      )}

      {/* ══════════════════════════════════════════
          LEFT PANEL — Visual storytelling
      ══════════════════════════════════════════ */}
      <div style={{
        width: '55%', minHeight: '100vh',
        position: 'relative', overflow: 'hidden',
        background: '#0F0F1A',
        display: 'none',
      }}
        className="login-left-panel"
      >
        {/* building.jpeg full background */}
        <img src="/images/building.jpeg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.25 }} />

        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(91,76,245,0.85) 0%, rgba(15,15,26,0.90) 100%)' }} />

        {/* Dot grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, padding: '60px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100vh', boxSizing: 'border-box' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#5B4CF5', fontWeight: 800, fontSize: 18, fontFamily: 'var(--font-mono)' }}>A</span>
            </div>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em' }}>AURA</span>
          </div>

          {/* Headline + features */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: 16, textTransform: 'uppercase' }}>
              Officer Portal
            </div>
            <h1 style={{ fontSize: 'clamp(36px, 4vw, 52px)', fontWeight: 800, color: 'white', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
              Resolve faster.<br />
              <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 300 }}>Govern smarter.</span>
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, maxWidth: 360, marginBottom: 40 }}>
              Your queue sorted by severity. Cluster alerts instant. SLA countdowns live. Every correction improves the AI.
            </p>

            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {f.icon}
                </div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{f.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom card with real office photo + stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                <img
                  src="/images/officer.png"
                  alt="Ward office"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', display: 'block', filter: 'brightness(0.75) saturate(0.9)', transform: 'scale(1.05)' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(15,15,26,0.85) 100%)' }} />
                <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {stats.map((s, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'white', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 3, fontWeight: 500 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT PANEL — Login form
      ══════════════════════════════════════════ */}
      <div style={{
        flex: 1,
        minHeight: '100vh',
        background: 'var(--bg-page)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 56px',
        boxSizing: 'border-box',
      }}
        className="login-right-panel"
      >
        {/* Mobile top bar (hidden on desktop) */}
        <div className="login-mobile-topbar" style={{ display: 'none', position: 'absolute', top: 0, left: 0, right: 0, padding: '20px 24px', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: 14, fontFamily: 'var(--font-mono)' }}>A</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>AURA</span>
        </div>

        <motion.form
          onSubmit={handleLogin}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%', maxWidth: 380 }}
        >
          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'var(--accent-light, #ede9fe)', border: '1px solid rgba(91,76,245,0.15)', borderRadius: 20, marginBottom: 20 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.04em' }}>GHMC · Hyderabad</span>
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 8 }}>
              Welcome back,<br />Officer
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Sign in to access your complaint queue and manage your ward assignments.
            </p>
          </div>

          {/* Fields with shake on error */}
          <motion.div animate={error ? { x: [-8, 8, -6, 6, 0] } : {}} transition={{ duration: 0.4 }}>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>
                Official Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="officer@aura.gov.in"
                style={{
                  width: '100%', height: 48, padding: '0 16px', boxSizing: 'border-box',
                  background: 'white', border: `1.5px solid ${error ? '#DC2626' : 'var(--border)'}`,
                  borderRadius: 10, fontSize: 14, color: 'var(--text-primary)',
                  outline: 'none', transition: 'all 0.15s ease', fontFamily: 'var(--font-sans)',
                }}
                onFocus={e => { e.target.style.borderColor = '#5B4CF5'; e.target.style.boxShadow = '0 0 0 3px rgba(91,76,245,0.08)' }}
                onBlur={e => { e.target.style.borderColor = error ? '#DC2626' : 'var(--border)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  style={{
                    width: '100%', height: 48, padding: '0 48px 0 16px', boxSizing: 'border-box',
                    background: 'white', border: `1.5px solid ${error ? '#DC2626' : 'var(--border)'}`,
                    borderRadius: 10, fontSize: 14, color: 'var(--text-primary)',
                    outline: 'none', transition: 'all 0.15s ease', fontFamily: 'var(--font-sans)',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#5B4CF5'; e.target.style.boxShadow = '0 0 0 3px rgba(91,76,245,0.08)' }}
                  onBlur={e => { e.target.style.borderColor = error ? '#DC2626' : 'var(--border)'; e.target.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 8, marginBottom: 16 }}
              >
                <span style={{ fontSize: 12, color: '#DC2626' }}>{error}</span>
              </motion.div>
            )}
          </motion.div>

          {/* Submit button */}
          <motion.button
            ref={btnRef}
            type="submit"
            whileHover={{ scale: 1.01, boxShadow: '0 12px 40px rgba(91,76,245,0.35)' }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            style={{
              width: '100%', height: 52, background: 'var(--accent)',
              color: 'white', border: 'none', borderRadius: 12, cursor: loading ? 'default' : 'pointer',
              fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 20px rgba(91,76,245,0.25)',
              transition: 'all 0.2s ease', marginBottom: 20,
              opacity: loading ? 0.85 : 1,
            }}
          >
            {loading ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', display: 'inline-block' }}
                />
                Signing in...
              </>
            ) : (
              <>
                Sign in to AURA
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </motion.button>

          {/* Demo credentials */}
          <div style={{ padding: '12px 16px', background: 'rgba(91,76,245,0.05)', border: '1px solid rgba(91,76,245,0.12)', borderRadius: 10, marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginBottom: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>DEMO CREDENTIALS</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>officer@aura.gov.in / demo</div>
          </div>

          {/* Back link */}
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.15s ease', padding: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
          >
            ← Back to home
          </button>

        </motion.form>
      </div>

      {/* ── Responsive styles injected via style tag ── */}
      <style>{`
        @media (min-width: 768px) {
          .login-left-panel { display: block !important; }
          .login-right-panel { flex: none !important; width: 45% !important; }
        }
        @media (max-width: 767px) {
          .login-right-panel { padding: 80px 24px 40px !important; }
          .login-mobile-topbar { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
