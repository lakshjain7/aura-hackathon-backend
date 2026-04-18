import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MapPin, Phone, User, Check, ChevronRight, X } from 'lucide-react'
import { requestOTP, verifyOTP } from '../../utils/api'
import { useToast } from '../../components/ui/Toast'
import { BHASHINI_LANGUAGES } from '../../utils/constants'
import { addPoints } from '../../utils/points'

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
  const [communities, setCommunities] = useState([])
  const [form, setForm] = useState({ name: '', phone: '', language: 'en', pincode: '', suburb: 'Madhapur', role: 'citizen' })
  
  useEffect(() => {
    const fetchComms = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/communities`)
        const data = await res.json()
        setCommunities(data)
      } catch (e) {
        console.error("Failed to fetch communities", e)
      }
    }
    fetchComms()
  }, [])
  const [location, setLocation] = useState(null)
  const [locating, setLocating] = useState(false)
  const [selectedGroups, setSelectedGroups] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
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
      const res = await verifyOTP({ phone: '+91' + form.phone, otp: code })
      if (res.data?.token) {
        localStorage.setItem('aura_token', res.data.token)
        localStorage.setItem('aura_user', JSON.stringify(res.data.user))
        addToast('Welcome to AURA!', 'success')
        setStep(3)
      } else throw new Error()
    } catch (e) {
      if (code !== '123456') {
        setOtpError('Invalid OTP. Use 123456 in demo.')
        setVerifying(false)
        return
      }
      // Demo fallback
      localStorage.setItem('aura_token', `${form.role}_${Date.now()}`)
      localStorage.setItem('aura_user', JSON.stringify({ name: form.name, role: form.role, phone: form.phone }))
      setStep(3)
    }
    setVerifying(false)
  }

  const handleJoinGroup = async (group) => {
    const isSelected = selectedGroups.includes(group.id)
    if (isSelected) {
      setSelectedGroups(s => s.filter(x => x !== group.id))
    } else {
      setSelectedGroups(s => [...s, group.id])
      try {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/communities/${group.id}/join?phone=${form.phone}`, { method: 'POST' })
      } catch (e) {}
    }
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

                {/* Role Selection */}
                <div style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
                  <button onClick={() => update('role', 'citizen')} style={{
                    flex: 1, padding: '10px', borderRadius: 12, border: `2px solid ${form.role === 'citizen' ? '#5B4CF5' : '#E5E7EB'}`,
                    background: form.role === 'citizen' ? '#EEF0FF' : 'white', cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: form.role === 'citizen' ? '#5B4CF5' : '#6B7280' }}>Citizen</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>Report & Track</div>
                  </button>
                  <button onClick={() => update('role', 'officer')} style={{
                    flex: 1, padding: '10px', borderRadius: 12, border: `2px solid ${form.role === 'officer' ? '#5B4CF5' : '#E5E7EB'}`,
                    background: form.role === 'officer' ? '#EEF0FF' : 'white', cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: form.role === 'officer' ? '#5B4CF5' : '#6B7280' }}>Officer</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>Solve & Verify</div>
                  </button>
                </div>

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

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {communities.map(group => {
                    const selected = selectedGroups.includes(group.id)
                    return (
                      <div key={group.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '16px',
                        borderRadius: 12, border: `1px solid ${selected ? '#5B4CF5' : '#E5E7EB'}`,
                        background: selected ? '#EEF0FF' : '#F9FAFB', position: 'relative'
                      }}>
                        <button 
                          onClick={() => handleJoinGroup(group)}
                          style={{ flex: 1, background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', padding: 0 }}
                        >
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{group.name}</div>
                          <div style={{ fontSize: 12, color: '#6B7280' }}>{group.topic} · {group.members} members</div>
                        </button>
                        
                        <a href={group.link} target="_blank" rel="noreferrer" style={{ color: '#5B4CF5', padding: 8 }}>
                          <X size={14} style={{ transform: 'rotate(45deg)' }} /> {/* External Link Icon */}
                        </a>

                        <div style={{
                          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                          background: selected ? '#5B4CF5' : 'white',
                          border: `2px solid ${selected ? '#5B4CF5' : '#D1D5DB'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {selected && <Check size={12} style={{ color: 'white' }} />}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <button 
                  onClick={() => setShowAddModal(true)}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 12, border: '2px dashed #D1D5DB',
                    background: 'transparent', color: '#6B7280', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  + Can't find your area? Create Local Watch Group
                </button>

                {showAddModal && (
                  <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
                  }}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'white', borderRadius: 24, padding: 32, width: '100%', maxWidth: 400 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>New Community Group</h3>
                      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>AURA AI will verify and propagate this group to your neighbors.</p>
                      
                      <input id="new-group-name" placeholder="Group Name (e.g. Kondapur Pothole Watch)" style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #E5E7EB', marginBottom: 12 }} />
                      <input id="new-group-link" placeholder="WhatsApp Invite Link" style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #E5E7EB', marginBottom: 20 }} />
                      
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #E5E7EB', background: 'white' }}>Cancel</button>
                        <button onClick={async () => {
                          const name = document.getElementById('new-group-name').value;
                          const link = document.getElementById('new-group-link').value;
                          if (!name || !link) return;
                          
                          const btn = document.getElementById('create-group-btn');
                          btn.innerText = 'Provisioning Agent...';
                          btn.disabled = true;

                          await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/communities`, {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              name, link, 
                              suburb: location?.suburb || 'General', 
                              topic: 'Community Watch',
                              phone: form.phone 
                            })
                          });
                          
                          addToast('AURA Agent Provisioned!', 'success');
                          setTimeout(() => window.location.reload(), 1500);
                        }} id="create-group-btn" style={{ flex: 1, padding: 12, borderRadius: 10, background: '#5B4CF5', color: 'white', border: 'none', cursor: 'pointer' }}>Create & Activate Bot</button>
                      </div>
                    </motion.div>
                  </div>
                )}

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
                  onClick={() => navigate(form.role === 'officer' ? '/officer' : '/citizen')}
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
