import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Button from '../../components/ui/Button'
import { BHASHINI_LANGUAGES } from '../../utils/constants'
import { useLanguage } from '../../hooks/useLanguage'
import { shake } from '../../animations/variants'
import { requestOTP, verifyOTP } from '../../utils/api'

export default function CitizenLogin() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { currentLang, setLanguage } = useLanguage()
  const [phone, setPhone] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showGroups, setShowGroups] = useState(false)
  const [joinedGroups, setJoinedGroups] = useState([])
  const otpRefs = useRef([])

  const WHATSAPP_GROUPS = [
    { id: 'wg-001', name: 'Madhapur Ward 14 Residents', members: 342, topic: 'Sanitation & Roads', active: true },
    { id: 'wg-002', name: 'Gachibowli Water Issues', members: 218, topic: 'Water Supply', active: false },
    { id: 'wg-003', name: 'HITEC City Civic Action', members: 567, topic: 'All Issues', active: false },
    { id: 'wg-004', name: 'Kondapur Residents Forum', members: 189, topic: 'Parks & Safety', active: false },
  ]

  const popularLangs = BHASHINI_LANGUAGES.slice(0, 6)

  const handleSendOTP = async () => {
    if (phone.length < 10) return
    setLoading(true)
    setError('')
    try {
      await requestOTP('+91' + phone)
      setOtpSent(true)
    } catch {
      // Demo fallback — always allows continuing
      setOtpSent(true)
    } finally {
      setLoading(false)
    }
  }

  const handleOTPChange = (index, value) => {
    if (value.length > 1) value = value[value.length - 1]
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError('')
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length < 6) return
    setLoading(true)
    setError('')
    try {
      const res = await verifyOTP('+91' + phone, code)
      const { token, role, user_id } = res.data

      localStorage.setItem('aura_token', token)
      localStorage.setItem('aura_role', role)
      if (user_id) localStorage.setItem('aura_user_id', user_id)

      if (role === 'officer') navigate('/officer')
      else if (role === 'admin') navigate('/admin')
      else setShowGroups(true)
    } catch {
      // Demo fallback — 123456 always works
      if (code === '123456') {
        localStorage.setItem('aura_token', 'citizen_demo')
        localStorage.setItem('aura_role', 'citizen')
        setShowGroups(true)
      } else {
        setError('Invalid OTP. Try 123456 for demo.')
        setOtp(['', '', '', '', '', ''])
        otpRefs.current[0]?.focus()
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (otp.every(d => d !== '')) handleVerify()
  }, [otp])

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--aura-bg-base)' }}>
      <motion.div
        className="w-full max-w-sm rounded-xl p-6"
        style={{ background: 'var(--aura-bg-surface)', border: '1px solid var(--aura-border)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="font-mono text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>AURA</div>
          <div className="text-sm" style={{ color: 'var(--text-accent)' }}>{t('auth.citizen_title')}</div>
        </div>

        {!otpSent ? (
          <>
            {/* Phone Input */}
            <div className="mb-4">
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                {t('auth.phone_label')}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono px-3 py-2 rounded-lg"
                  style={{ background: 'var(--aura-bg-elevated)', color: 'var(--text-tertiary)', border: '1px solid var(--aura-border)' }}>
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className="flex-1 h-10 px-3 rounded-lg text-sm font-mono outline-none"
                  style={{
                    background: 'var(--aura-bg-elevated)',
                    border: '1px solid var(--aura-border)',
                    color: 'var(--text-primary)',
                  }}
                  autoFocus
                />
              </div>
            </div>
            <Button className="w-full" size="lg" loading={loading} onClick={handleSendOTP}>
              {loading ? t('auth.sending') : t('auth.get_otp')}
            </Button>
          </>
        ) : (
          <>
            {/* OTP Input */}
            <div className="mb-4">
              <label className="text-xs mb-2 block text-center" style={{ color: 'var(--text-secondary)' }}>
                Enter the 6-digit OTP sent to +91 {phone}
              </label>
              <motion.div
                className="flex justify-center gap-2"
                animate={error ? shake : {}}
              >
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => otpRefs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={e => handleOTPChange(i, e.target.value)}
                    onKeyDown={e => handleOTPKeyDown(i, e)}
                    className="w-12 h-12 text-center text-lg font-mono rounded-lg outline-none"
                    style={{
                      background: 'var(--aura-bg-elevated)',
                      border: `1px solid ${error ? 'var(--sev-critical)' : digit ? 'var(--aura-accent)' : 'var(--aura-border)'}`,
                      color: 'var(--text-primary)',
                    }}
                    maxLength={1}
                    autoFocus={i === 0}
                  />
                ))}
              </motion.div>
              {error && (
                <motion.p
                  className="text-xs text-center mt-2"
                  style={{ color: 'var(--sev-critical)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {error}
                </motion.p>
              )}
            </div>
            <Button className="w-full" size="lg" loading={loading} onClick={handleVerify}>
              {loading ? t('auth.verifying') : t('auth.verify_otp')}
            </Button>
          </>
        )}

        {/* Language selector */}
        <div className="mt-6 flex flex-wrap justify-center gap-1.5">
          {popularLangs.map(lang => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className="px-2 py-1 rounded text-[10px] cursor-pointer transition-all"
              style={{
                background: currentLang === lang.code ? 'var(--aura-accent)' : 'var(--aura-bg-elevated)',
                border: `1px solid ${currentLang === lang.code ? 'var(--aura-accent)' : 'var(--aura-border)'}`,
                color: currentLang === lang.code ? 'white' : 'var(--text-tertiary)',
              }}
            >
              {lang.nativeName}
            </button>
          ))}
        </div>

        {/* First time link */}
        <p style={{ textAlign: 'center', marginTop: 16 }}>
          <button style={{ fontSize: 12, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => navigate('/register')}>
            New user? Register free →
          </button>
        </p>
      </motion.div>

      {/* WhatsApp Groups overlay after login */}
      <AnimatePresence>
        {showGroups && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50 }} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51, background: 'white', borderRadius: '24px 24px 0 0', padding: '28px 24px 40px', maxHeight: '80vh', overflowY: 'auto' }}
            >
              <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E5E7EB', margin: '0 auto 24px' }} />
              <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Welcome back! 👋</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>Join WhatsApp groups in your area to stay updated on complaints</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {WHATSAPP_GROUPS.map(group => {
                  const joined = joinedGroups.includes(group.id)
                  return (
                    <div key={group.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: joined ? '#F0FDF4' : '#F9FAFB', borderRadius: 14, border: `1px solid ${joined ? '#BBF7D0' : '#E5E7EB'}` }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{group.name}</div>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>{group.topic} · {group.members} members {group.active && <span style={{ color: '#16A34A', fontWeight: 600 }}>· Active now</span>}</div>
                      </div>
                      <button
                        onClick={() => setJoinedGroups(prev => joined ? prev.filter(x => x !== group.id) : [...prev, group.id])}
                        style={{ marginLeft: 12, padding: '8px 16px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: joined ? '#DCFCE7' : '#5B4CF5', color: joined ? '#16A34A' : 'white', flexShrink: 0 }}
                      >
                        {joined ? '✓ Joined' : 'Join'}
                      </button>
                    </div>
                  )
                })}
              </div>

              <button onClick={() => navigate('/citizen')} style={{ width: '100%', padding: '15px', borderRadius: 14, background: '#5B4CF5', color: 'white', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                {joinedGroups.length > 0 ? `Continue with ${joinedGroups.length} group${joinedGroups.length > 1 ? 's' : ''} →` : 'Skip for now →'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
