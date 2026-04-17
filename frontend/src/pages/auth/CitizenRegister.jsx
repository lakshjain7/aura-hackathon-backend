import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MapPin, Phone, User, Check, ChevronRight, X } from 'lucide-react'
import { requestOTP, verifyOTP } from '../../utils/api'
import { useToast } from '../../components/ui/Toast'
import { BHASHINI_LANGUAGES } from '../../utils/constants'
import { addPoints } from '../../utils/points'

const WHATSAPP_GROUPS = [
  { id: 'wg-001', name: 'Madhapur Ward 14 Residents', members: 342, topic: 'Sanitation & Roads', suburb: 'Madhapur' },
  { id: 'wg-002', name: 'Gachibowli Water Issues', members: 218, topic: 'Water Supply', suburb: 'Gachibowli' },
  { id: 'wg-003', name: 'HITEC City Civic Action', members: 567, topic: 'All Issues', suburb: 'HITEC City' },
  { id: 'wg-004', name: 'Kondapur Residents Forum', members: 189, topic: 'Parks & Safety', suburb: 'Kondapur' },
]

const TOP_LANGS = ['en', 'hi', 'te', 'ta', 'kn', 'ml', 'bn', 'mr']
const IMPACT_START = 50

const easeOut = [0.16, 1, 0.3, 1]
const slideUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: easeOut } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.25, ease: easeOut } },
}

export default function CitizenRegister() {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: '', phone: '', language: 'en', pincode: '', suburb: 'Madhapur' })
  const [location, setLocation] = useState(null)
  const [locating, setLocating] = useState(false)
  const [selectedGroups, setSelectedGroups] = useState([])
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpSent, setOtpSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [otpError, setOtpError] = useState('')

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleGetLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
          const data = await res.json()
          const suburb = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || 'Your Area'
          setLocation({ lat: latitude, lng: longitude, suburb })
          update('suburb', suburb)
        } catch {
          setLocation({ lat: latitude, lng: longitude, suburb: 'Your Area' })
        }
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const handleSendOTP = async () => {
    if (!form.phone || form.phone.length < 10) { setOtpError('Enter a valid 10-digit phone number'); return }
    setSending(true)
    setOtpError('')
    try {
      await requestOTP('+91' + form.phone)
    } catch {}
    setOtpSent(true)
    setSending(false)
    addToast('OTP sent to +91 ' + form.phone, 'success')
  }

  const handleOtpChange = (i, val) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[i] = val.slice(-1)
    setOtp(next)
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus()
  }

  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length < 6) { setOtpError('Enter all 6 digits'); return }
    setVerifying(true)
    setOtpError('')
    try {
      const res = await verifyOTP('+91' + form.phone, code)
      if (res.data?.token) localStorage.setItem('aura_token', res.data.token)
      else throw new Error()
    } catch {
      if (code !== '123456') {
        setOtpError('Invalid OTP. Use 123456 in demo.')
        setVerifying(false)
        return
      }
    }
    localStorage.setItem('aura_token', `citizen_${Date.now()}`)
    localStorage.setItem('aura_role', 'citizen')
    localStorage.setItem('aura_name', form.name)
    localStorage.setItem('aura_phone', form.phone)
    localStorage.setItem('aura_lang', form.language)
    addPoints(IMPACT_START, 'Registered on AURA')
    setVerifying(false)
    setStep(3)
  }

  const topLangs = BHASHINI_LANGUAGES.filter(l => TOP_LANGS.includes(l.code))

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px 80px', fontFamily: 'var(--font-sans)' }}>

      {/* Header */}
      <div style={{ width: '100%', maxWidth: 520, marginBottom: 40 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 32, padding: 0 }}>
          ← Back to home
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#5B4CF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: 14, fontFamily: 'var(--font-mono)' }}>A</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>AURA</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>Create your account</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Join 84,000 citizens making Hyderabad better</p>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step > s ? '#16A34A' : step === s ? '#5B4CF5' : '#E5E7EB',
                fontSize: 12, fontWeight: 700, color: step >= s ? 'white' : '#9CA3AF',
                transition: 'all 0.3s ease',
              }}>
                {step > s ? <Check size={13} /> : s}
              </div>
              <span style={{ fontSize: 12, color: step === s ? '#5B4CF5' : '#9CA3AF', fontWeight: step === s ? 600 : 400 }}>
                {s === 1 ? 'Your Info' : s === 2 ? 'Community' : 'Welcome'}
              </span>
              {s < 3 && <div style={{ width: 32, height: 1, background: step > s ? '#16A34A' : '#E5E7EB' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div style={{ width: '100%', maxWidth: 520 }}>
        <AnimatePresence mode="wait">

          {/* Step 1 — Basic Info */}
          {step === 1 && (
            <motion.div key="step1" initial="hidden" animate="visible" exit="exit" variants={slideUp}>
              <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E7EB', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 24 }}>Basic Information</h2>

                {/* Name */}
                <label style={{ display: 'block', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={14} style={{ color: '#6B7280' }} /> Full Name
                  </div>
                  <input
                    value={form.name}
                    onChange={e => update('name', e.target.value)}
                    placeholder="Smt. Priya Reddy"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 15, outline: 'none', boxSizing: 'border-box', color: '#111827', background: '#F9FAFB' }}
                    onFocus={e => { e.target.style.borderColor = '#5B4CF5'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 3px rgba(91,76,245,0.08)' }}
                    onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; e.target.style.boxShadow = 'none' }}
                  />
                </label>

                {/* Phone */}
                <label style={{ display: 'block', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Phone size={14} style={{ color: '#6B7280' }} /> WhatsApp Number
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', background: '#F9FAFB' }}>
                    <div style={{ padding: '12px 14px', fontSize: 15, color: '#6B7280', borderRight: '1px solid #E5E7EB', flexShrink: 0 }}>+91</div>
                    <input
                      value={form.phone}
                      onChange={e => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      inputMode="numeric"
                      style={{ flex: 1, padding: '12px 14px', border: 'none', fontSize: 15, outline: 'none', background: 'transparent', fontFamily: 'var(--font-mono)', color: '#111827' }}
                    />
                  </div>
                </label>

                {/* Language */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Preferred Language</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {topLangs.map(lang => (
                      <button key={lang.code} onClick={() => update('language', lang.code)} style={{
                        padding: '7px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                        background: form.language === lang.code ? '#5B4CF5' : '#F3F4F6',
                        color: form.language === lang.code ? 'white' : '#374151',
                        border: 'none', fontWeight: 500, transition: 'all 0.15s',
                      }}>{lang.nativeName}</button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} style={{ color: '#6B7280' }} /> Your Location
                  </div>
                  <button onClick={handleGetLocation} disabled={locating} style={{
                    width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #5B4CF5',
                    background: location ? '#EEF0FF' : 'white', color: location ? '#5B4CF5' : '#5B4CF5',
                    fontSize: 14, fontWeight: 500, cursor: locating ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                    {locating ? (
                      <>Getting location…</>
                    ) : location ? (
                      <><Check size={15} /> {location.suburb} · GPS confirmed</>
                    ) : (
                      <><MapPin size={15} /> Allow location access</>
                    )}
                  </button>
                  {!location && (
                    <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                      <input
                        value={form.pincode}
                        onChange={e => update('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Or enter 6-digit pincode"
                        inputMode="numeric"
                        style={{ flex: 1, padding: '11px 14px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, outline: 'none', background: '#F9FAFB', fontFamily: 'var(--font-mono)', color: '#111827' }}
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => { if (!form.name || !form.phone) { addToast('Fill in your name and phone number', 'error'); return } setStep(2) }}
                  style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#5B4CF5', color: 'white', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2 — Community + OTP */}
          {step === 2 && (
            <motion.div key="step2" initial="hidden" animate="visible" exit="exit" variants={slideUp}>
              <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E7EB', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Join Your Community</h2>
                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>WhatsApp groups near {location?.suburb || 'your area'}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {WHATSAPP_GROUPS.map(group => {
                    const selected = selectedGroups.includes(group.id)
                    return (
                      <button key={group.id} onClick={() => setSelectedGroups(s => selected ? s.filter(x => x !== group.id) : [...s, group.id])} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px',
                        borderRadius: 12, border: `1px solid ${selected ? '#5B4CF5' : '#E5E7EB'}`,
                        background: selected ? '#EEF0FF' : '#F9FAFB', cursor: 'pointer', textAlign: 'left',
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{group.name}</div>
                          <div style={{ fontSize: 12, color: '#6B7280' }}>{group.topic} · {group.members} members</div>
                        </div>
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                          background: selected ? '#5B4CF5' : 'white',
                          border: `2px solid ${selected ? '#5B4CF5' : '#D1D5DB'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {selected && <Check size={13} style={{ color: 'white' }} />}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 16 }}>Verify your number</div>

                  {!otpSent ? (
                    <button onClick={handleSendOTP} disabled={sending} style={{
                      width: '100%', padding: '13px', borderRadius: 10, background: '#5B4CF5', color: 'white',
                      border: 'none', fontSize: 14, fontWeight: 600, cursor: sending ? 'default' : 'pointer',
                    }}>
                      {sending ? 'Sending OTP…' : `Send OTP to +91 ${form.phone}`}
                    </button>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', gap: 10, marginBottom: 12, justifyContent: 'center' }}>
                        {otp.map((digit, i) => (
                          <input
                            key={i}
                            id={`otp-${i}`}
                            value={digit}
                            onChange={e => handleOtpChange(i, e.target.value)}
                            onKeyDown={e => { if (e.key === 'Backspace' && !digit && i > 0) document.getElementById(`otp-${i - 1}`)?.focus() }}
                            inputMode="numeric"
                            maxLength={1}
                            style={{
                              width: 48, height: 52, borderRadius: 10, border: `1.5px solid ${digit ? '#5B4CF5' : '#E5E7EB'}`,
                              textAlign: 'center', fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)',
                              outline: 'none', background: digit ? '#EEF0FF' : '#F9FAFB', color: '#111827',
                            }}
                          />
                        ))}
                      </div>
                      {otpError && <p style={{ fontSize: 12, color: '#DC2626', textAlign: 'center', marginBottom: 12 }}>{otpError}</p>}
                      <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginBottom: 16 }}>Enter demo OTP: 123456</p>
                      <button onClick={handleVerify} disabled={verifying} style={{
                        width: '100%', padding: '13px', borderRadius: 10, background: '#5B4CF5', color: 'white',
                        border: 'none', fontSize: 14, fontWeight: 600, cursor: verifying ? 'default' : 'pointer',
                      }}>
                        {verifying ? 'Verifying…' : 'Verify & Continue'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3 — Welcome */}
          {step === 3 && (
            <motion.div key="step3" initial="hidden" animate="visible" exit="exit" variants={slideUp}>
              <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E7EB', padding: '40px 32px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 280 }}
                  style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #5B4CF5, #7C6FF7)', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <span style={{ fontSize: 28 }}>🎉</span>
                </motion.div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Welcome to AURA, {form.name.split(' ')[0]}!</h2>
                <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 32 }}>You're now part of 84,000 citizens making Hyderabad better.</p>

                <div style={{ background: 'linear-gradient(135deg, #5B4CF5, #7C6FF7)', borderRadius: 16, padding: '24px', marginBottom: 24, color: 'white', textAlign: 'left' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', opacity: 0.7, marginBottom: 8 }}>IMPACT POINTS</div>
                  <div style={{ fontSize: 40, fontWeight: 800, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{IMPACT_START}</div>
                  <div style={{ fontSize: 13, opacity: 0.8 }}>Awarded for joining the platform</div>
                  <div style={{ marginTop: 16, fontSize: 12, opacity: 0.7 }}>
                    Earn more: +100 per complaint · +20 per confirmation · Top citizens get councillor recognition
                  </div>
                </div>

                {selectedGroups.length > 0 && (
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '14px 18px', marginBottom: 24, textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#16A34A', marginBottom: 4 }}>✓ Joined {selectedGroups.length} WhatsApp group{selectedGroups.length > 1 ? 's' : ''}</div>
                    <div style={{ fontSize: 12, color: '#166534' }}>You'll receive real-time updates about complaints in your area</div>
                  </div>
                )}

                <button
                  onClick={() => navigate('/citizen')}
                  style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#5B4CF5', color: 'white', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
                >
                  Go to My Dashboard →
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
